<script setup>
import { ref } from "vue";

const props = defineProps({
  campaign: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["location-selected"]);

const keyword = ref("");
const loading = ref(false);
const results = ref([]);
const error = ref("");

function getSearchQuery(q) {
  const cityName =
    props.campaign?.city === "melbourne" ? "Melbourne, Victoria" : "Australia";
  return `${q}, ${cityName}`;
}

async function searchLocation() {
  const q = keyword.value.trim();

  if (!q) return;

  loading.value = true;
  error.value = "";
  results.value = [];

  try {
    const centerLat = props.campaign?.centerLat || -37.8136;
    const centerLng = props.campaign?.centerLng || 144.9631;

    // Melbourne 周边搜索范围，大概限制在维州/墨尔本附近
    const left = centerLng - 1.2;
    const right = centerLng + 1.2;
    const top = centerLat + 0.8;
    const bottom = centerLat - 0.8;

    const params = new URLSearchParams({
      format: "json",
      q: getSearchQuery(q),
      limit: "6",
      addressdetails: "1",
      countrycodes: "au",
      bounded: "1",
      viewbox: `${left},${top},${right},${bottom}`,
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    results.value = data;

    if (data.length === 0) {
      error.value = "No location found around this map area.";
    }
  } catch (e) {
    console.error(e);
    error.value = "Search failed. Please try again.";
  } finally {
    loading.value = false;
  }
}

function selectLocation(place) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lon);

  emit("location-selected", {
    lat,
    lng,
    name: place.display_name,
  });

  results.value = [];
  keyword.value = place.display_name.split(",")[0];
}
</script>

<template>
  <div class="location-search">
    <div class="search-row">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="Search suburb, street, or landmark in Melbourne..."
        @keyup.enter="searchLocation"
      />

      <button
        class="search-btn"
        :disabled="loading || !keyword.trim()"
        @click="searchLocation"
      >
        {{ loading ? "Searching..." : "Search" }}
      </button>
    </div>

    <p v-if="error" class="search-error">{{ error }}</p>

    <div v-if="results.length > 0" class="search-results">
      <div
        v-for="place in results"
        :key="place.place_id"
        class="search-result-item"
        @click="selectLocation(place)"
      >
        📍 {{ place.display_name }}
      </div>
    </div>
  </div>
</template>
