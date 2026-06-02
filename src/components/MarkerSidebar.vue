<script setup>
import { computed } from "vue";
import { getColor } from "../utils/colors";

const props = defineProps({
  markers: {
    type: Array,
    default: () => [],
  },
  nickname: {
    type: String,
    default: "",
  },
  filterBy: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:filterBy", "fly-to", "delete-marker"]);

const uniqueMembers = computed(() => {
  return [...new Set(props.markers.map((m) => m.nickname))];
});

const memberStats = computed(() => {
  const stats = {};

  for (const marker of props.markers) {
    stats[marker.nickname] = (stats[marker.nickname] || 0) + 1;
  }

  return Object.entries(stats).sort((a, b) => b[1] - a[1]);
});

const filteredMarkers = computed(() => {
  if (!props.filterBy) return props.markers;
  return props.markers.filter((m) => m.nickname === props.filterBy);
});

function setFilter(name) {
  emit("update:filterBy", name);
}

function statusLabel(status) {
  return (
    {
      done: "Distributed",
      progress: "In Progress",
      skip: "Skipped",
    }[status] || "Distributed"
  );
}

function statusClass(status) {
  return (
    {
      done: "s-done",
      progress: "s-progress",
      skip: "s-skip",
    }[status] || "s-done"
  );
}

function formatTime(ts) {
  if (!ts?.seconds) return "";

  return new Date(ts.seconds * 1000).toLocaleString("en-AU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="map-sidebar">
    <div class="sidebar-section">
      <h3>Team Stats</h3>

      <div v-if="memberStats.length === 0" class="empty-sidebar-text">
        No markers yet
      </div>

      <div v-for="[name, count] in memberStats" :key="name" class="member-row">
        <div class="member-dot" :style="{ background: getColor(name) }"></div>
        <span class="member-name">{{ name }}</span>
        <span class="member-count">{{ count }}</span>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="filter-title">Filter by member</div>

      <div class="filter-chips">
        <button
          class="filter-chip"
          :class="{ active: !filterBy }"
          @click="setFilter('')"
        >
          All
        </button>

        <button
          v-for="name in uniqueMembers"
          :key="name"
          class="filter-chip"
          :class="{ active: filterBy === name }"
          :style="
            filterBy === name
              ? {
                  background: getColor(name),
                  borderColor: getColor(name),
                  color: '#fff',
                }
              : {}
          "
          @click="setFilter(filterBy === name ? '' : name)"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <div class="marker-list">
      <div v-if="filteredMarkers.length === 0" class="no-markers">
        No markers yet
      </div>

      <div
        v-for="m in filteredMarkers"
        :key="m.id"
        class="marker-item"
        @click="emit('fly-to', m)"
      >
        <div
          class="marker-color-dot"
          :style="{ background: m.color || getColor(m.nickname) }"
        ></div>

        <div class="marker-info">
          <div class="marker-top">
            <span class="marker-nick">{{ m.nickname }}</span>
            <span class="status-badge" :class="statusClass(m.status)">
              {{ statusLabel(m.status) }}
            </span>
          </div>

          <div class="marker-note">
            {{ m.note || "No note" }}
          </div>

          <div class="marker-time">
            {{ formatTime(m.createdAt) }}
          </div>
        </div>

        <button
          v-if="m.nickname === nickname"
          class="marker-del"
          title="Delete marker"
          @click.stop="emit('delete-marker', m.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
