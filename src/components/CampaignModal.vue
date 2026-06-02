<script setup>
import { ref } from "vue";
import { CITIES } from "../utils/cities";

const emit = defineEmits(["close", "create"]);

const form = ref({
  name: "",
  description: "",
  city: "melbourne",
  lat: "",
  lng: "",
  zoom: 13,
});

function submit() {
  if (!form.value.name.trim()) return;
  emit("create", { ...form.value });
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card">
      <h3>🗺️ New Map Project</h3>

      <div class="form-group">
        <label>Project Name *</label>
        <input
          v-model="form.name"
          class="form-input"
          placeholder="Melbourne Flyer Distribution Map"
          maxlength="60"
        />
      </div>

      <div class="form-group">
        <label>Description</label>
        <input
          v-model="form.description"
          class="form-input"
          placeholder="Track completed flyer distribution areas"
        />
      </div>

      <div class="form-group">
        <label>City</label>
        <select v-model="form.city" class="form-input form-select">
          <option v-for="p in CITIES" :key="p.id" :value="p.id">
            {{ p.flag }} {{ p.name }}
          </option>
        </select>
      </div>

      <div v-if="form.city === 'custom'" class="custom-coords">
        <div class="form-group">
          <label>Latitude</label>
          <input v-model="form.lat" class="form-input" placeholder="-37.81" />
        </div>

        <div class="form-group">
          <label>Longitude</label>
          <input v-model="form.lng" class="form-input" placeholder="144.96" />
        </div>

        <div class="form-group">
          <label>Zoom</label>
          <input
            v-model="form.zoom"
            class="form-input"
            type="number"
            min="5"
            max="18"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">Cancel</button>

        <button
          class="btn-primary btn-confirm"
          :disabled="!form.name.trim()"
          @click="submit"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>
