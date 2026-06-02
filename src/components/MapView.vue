<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { db } from "../firebase";
import { getColor } from "../utils/colors";
import LocationSearch from "./LocationSearch.vue";
import MarkerSidebar from "./MarkerSidebar.vue";

const route = useRoute();
const router = useRouter();

const campaignId = route.params.id;
const nickname = ref(localStorage.getItem("mp_nick") || "");

const campaign = ref(null);
const markers = ref([]);
const filterBy = ref("");
const sidebarOpen = ref(true);

const showMarkerModal = ref(false);
const pendingLatLng = ref(null);
const markerNote = ref("");
const markerStatus = ref("done");

let map = null;
let unsubscribeMarkers = null;
const leafletMarkers = {};

function makeIcon(color, status) {
  const symbols = {
    done: "✓",
    progress: "…",
    skip: "×",
  };

  const sym = symbols[status] || "✓";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 46" width="32" height="46">
      <defs>
        <filter id="ds">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path
        d="M16 0C7.16 0 0 7.16 0 16c0 12.44 16 30 16 30s16-17.56 16-30C32 7.16 24.84 0 16 0z"
        fill="${color}"
        filter="url(#ds)"
      />
      <circle cx="16" cy="16" r="9" fill="rgba(255,255,255,0.95)"/>
      <text
        x="16"
        y="20.5"
        text-anchor="middle"
        font-size="10"
        font-weight="bold"
        fill="${color}"
      >
        ${sym}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 46],
    iconAnchor: [16, 46],
    popupAnchor: [0, -48],
  });
}

function buildPopup(marker, color) {
  const labels = {
    done: " Distributed",
    progress: " In Progress",
    skip: "⏭️ Skipped",
  };

  const time = marker.createdAt?.seconds
    ? new Date(marker.createdAt.seconds * 1000).toLocaleString("en-AU")
    : "";

  return `
    <div style="min-width:180px;font-family:-apple-system,sans-serif;line-height:1.5">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
        <div style="width:13px;height:13px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <strong style="font-size:14px">${marker.nickname}</strong>
        <span style="font-size:11px;background:#F3F4F6;padding:1px 7px;border-radius:4px">
          ${labels[marker.status] || " Distributed"}
        </span>
      </div>

      ${
        marker.note
          ? `<p style="font-size:13px;color:#374151;margin-bottom:5px">${marker.note}</p>`
          : ""
      }

      <p style="font-size:11px;color:#9CA3AF">${time}</p>
    </div>
  `;
}

async function loadCampaign() {
  const docRef = doc(db, "campaigns", campaignId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    alert("This map project does not exist.");
    router.push("/campaigns");
    return;
  }

  campaign.value = {
    id: snap.id,
    ...snap.data(),
  };

  initMap();
  subscribeMarkers();
}

function initMap() {
  if (!campaign.value) return;

  if (map) {
    map.remove();
    map = null;
  }

  map = L.map("leaflet-map", {
    zoomControl: true,
  }).setView(
    [campaign.value.centerLat, campaign.value.centerLng],
    campaign.value.zoom || 13,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  map.on("click", (e) => {
    openMarkerModal(e.latlng, "");
  });
}

function subscribeMarkers() {
  const markersRef = collection(db, "campaigns", campaignId, "markers");
  const q = query(markersRef, orderBy("createdAt", "desc"));

  unsubscribeMarkers = onSnapshot(q, (snapshot) => {
    const ids = new Set(snapshot.docs.map((d) => d.id));

    for (const id of Object.keys(leafletMarkers)) {
      if (!ids.has(id)) {
        if (map) map.removeLayer(leafletMarkers[id]);
        delete leafletMarkers[id];
      }
    }

    markers.value = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    for (const marker of markers.value) {
      if (!leafletMarkers[marker.id] && map) {
        const color = marker.color || getColor(marker.nickname);
        const icon = makeIcon(color, marker.status);

        const leafletMarker = L.marker([marker.lat, marker.lng], {
          icon,
        })
          .addTo(map)
          .bindPopup(buildPopup(marker, color));

        leafletMarkers[marker.id] = leafletMarker;
      }
    }
  });
}

function openMarkerModal(latlng, note = "") {
  pendingLatLng.value = {
    lat: latlng.lat,
    lng: latlng.lng,
  };

  markerNote.value = note;
  markerStatus.value = "done";
  showMarkerModal.value = true;
}

function handleLocationSelected(place) {
  if (!map) return;

  map.flyTo([place.lat, place.lng], 16, {
    duration: 0.8,
  });

  openMarkerModal(
    {
      lat: place.lat,
      lng: place.lng,
    },
    place.name || "",
  );
}

async function confirmMarker() {
  if (!pendingLatLng.value) return;

  await addDoc(collection(db, "campaigns", campaignId, "markers"), {
    lat: pendingLatLng.value.lat,
    lng: pendingLatLng.value.lng,
    note: markerNote.value.trim(),
    status: markerStatus.value,
    nickname: nickname.value,
    color: getColor(nickname.value),
    createdAt: serverTimestamp(),
  });

  closeMarkerModal();
}

function closeMarkerModal() {
  showMarkerModal.value = false;
  pendingLatLng.value = null;
  markerNote.value = "";
  markerStatus.value = "done";
}

async function deleteMarker(id) {
  const ok = confirm("Delete this marker?");
  if (!ok) return;

  await deleteDoc(doc(db, "campaigns", campaignId, "markers", id));
}

function flyToMarker(marker) {
  if (!map) return;

  map.flyTo([marker.lat, marker.lng], 16, {
    duration: 0.8,
  });

  if (leafletMarkers[marker.id]) {
    leafletMarkers[marker.id].openPopup();
  }
}

function backToCampaigns() {
  router.push("/campaigns");
}

onMounted(() => {
  loadCampaign();
});

onUnmounted(() => {
  if (unsubscribeMarkers) unsubscribeMarkers();

  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<template>
  <div class="map-page">
    <div class="map-topbar">
      <button class="btn-back" @click="backToCampaigns">←</button>

      <span class="map-title">
        {{ campaign?.name || "Flyer Distribution Map" }}
      </span>

      <span class="map-hint">
        Search a location or click the map to add a marker
      </span>

      <span class="badge badge-purple"> {{ markers.length }} markers </span>

      <button class="btn-sidebar" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? "Hide Sidebar" : "Show Sidebar" }}
      </button>
    </div>

    <div class="map-body">
      <div id="leaflet-map"></div>

      <LocationSearch
        :campaign="campaign"
        @location-selected="handleLocationSelected"
      />

      <MarkerSidebar
        v-if="sidebarOpen"
        v-model:filterBy="filterBy"
        :markers="markers"
        :nickname="nickname"
        @fly-to="flyToMarker"
        @delete-marker="deleteMarker"
      />
    </div>

    <div
      v-if="showMarkerModal"
      class="marker-modal-overlay"
      @click.self="closeMarkerModal"
    >
      <div class="marker-modal">
        <div class="modal-drag-handle"></div>

        <div class="marker-modal-header">
          <div>
            <h3>📍 Add Distribution Marker</h3>
            <p>Confirm this location as a flyer distribution point.</p>
          </div>
        </div>

        <div class="form-group">
          <label>Status</label>

          <div class="status-row">
            <button
              type="button"
              class="status-option opt-done"
              :class="{ active: markerStatus === 'done' }"
              @click="markerStatus = 'done'"
            >
              Distributed
            </button>

            <button
              type="button"
              class="status-option opt-progress"
              :class="{ active: markerStatus === 'progress' }"
              @click="markerStatus = 'progress'"
            >
              In Progress
            </button>

            <!-- <button
              type="button"
              class="status-option opt-skip"
              :class="{ active: markerStatus === 'skip' }"
              @click="markerStatus = 'skip'"
            >
              ⏭️ Skipped
            </button> -->
          </div>
        </div>

        <div class="form-group">
          <label>Note</label>

          <input
            v-model="markerNote"
            class="form-input"
            placeholder="Example: Flyers distributed around Melbourne Central"
            @keyup.enter="confirmMarker"
          />
        </div>

        <div class="marker-modal-footer">
          <button class="btn-cancel" @click="closeMarkerModal">Cancel</button>

          <button class="btn-primary marker-confirm-btn" @click="confirmMarker">
            Mark as Distributed
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
