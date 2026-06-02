<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";
import { CITIES } from "../utils/cities";
import { getColor } from "../utils/colors";
import CampaignModal from "./CampaignModal.vue";

const router = useRouter();

const nickname = ref(localStorage.getItem("mp_nick") || "");
const campaigns = ref([]);
const showNewCampaign = ref(false);

let unsubscribeCampaigns = null;

function loadCampaigns() {
  const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));

  unsubscribeCampaigns = onSnapshot(q, (snapshot) => {
    campaigns.value = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  });
}

async function createCampaign(form) {
  const preset = CITIES.find((p) => p.id === form.city);

  const lat =
    form.city === "custom" ? parseFloat(form.lat) || preset.lat : preset.lat;

  const lng =
    form.city === "custom" ? parseFloat(form.lng) || preset.lng : preset.lng;

  const zoom = form.city === "custom" ? parseInt(form.zoom) || 13 : preset.zoom;

  await addDoc(collection(db, "campaigns"), {
    name: form.name.trim(),
    description: form.description.trim(),
    city: form.city,
    centerLat: lat,
    centerLng: lng,
    zoom,
    createdBy: nickname.value,
    createdAt: serverTimestamp(),
  });

  showNewCampaign.value = false;
}

async function deleteCampaign(campaign) {
  const ok = confirm(
    `Delete "${campaign.name}"? All markers will also be deleted.`,
  );

  if (!ok) return;

  const markersRef = collection(db, "campaigns", campaign.id, "markers");
  const markerSnap = await getDocs(markersRef);

  const batch = writeBatch(db);

  markerSnap.docs.forEach((markerDoc) => {
    batch.delete(markerDoc.ref);
  });

  batch.delete(doc(db, "campaigns", campaign.id));

  await batch.commit();
}

function enterCampaign(campaign) {
  router.push(`/map/${campaign.id}`);
}

function logout() {
  localStorage.removeItem("mp_nick");
  router.push("/login");
}

function cityName(id) {
  return CITIES.find((p) => p.id === id)?.name || id;
}

function cityEmoji(id) {
  return CITIES.find((p) => p.id === id)?.flag || "📍";
}

onMounted(() => {
  loadCampaigns();
});

onUnmounted(() => {
  if (unsubscribeCampaigns) unsubscribeCampaigns();
});
</script>

<template>
  <div class="campaigns-page">
    <div class="top-bar">
      <div class="brand">
        <div class="brand-icon">📍</div>
        <h1>MapPin</h1>
      </div>

      <div class="user-area">
        <div class="avatar" :style="{ background: getColor(nickname) }">
          {{ nickname ? nickname[0].toUpperCase() : "?" }}
        </div>

        <span class="user-name">{{ nickname }}</span>

        <button class="btn-ghost" @click="logout">Logout</button>
      </div>
    </div>

    <div class="campaigns-content">
      <div class="campaigns-header">
        <div>
          <h2>Map Projects</h2>
          <p>Track flyer distribution areas with your team</p>
        </div>

        <button class="btn-create" @click="showNewCampaign = true">
          ＋ New Map
        </button>
      </div>

      <div class="campaigns-grid">
        <div v-if="campaigns.length === 0" class="empty-state">
          <div class="big-icon">🗺️</div>
          <p>No map project yet. Click “New Map” to start.</p>
        </div>

        <div
          v-for="c in campaigns"
          :key="c.id"
          class="campaign-card"
          @click="enterCampaign(c)"
        >
          <div class="card-header">
            <div class="card-icon">{{ cityEmoji(c.city) }}</div>

            <button
              class="btn-del"
              title="Delete project"
              @click.stop="deleteCampaign(c)"
            >
              ✕
            </button>
          </div>

          <h3>{{ c.name }}</h3>
          <p class="desc">{{ c.description || "No description" }}</p>

          <div class="card-meta">
            <span class="meta-item">📍 {{ cityName(c.city) }}</span>
            <span class="meta-item">👤 {{ c.createdBy }}</span>
          </div>
        </div>
      </div>
    </div>

    <CampaignModal
      v-if="showNewCampaign"
      @close="showNewCampaign = false"
      @create="createCampaign"
    />
  </div>
</template>
