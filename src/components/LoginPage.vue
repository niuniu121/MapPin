<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const nicknameInput = ref("");

function confirmNickname() {
  const nickname = nicknameInput.value.trim();

  if (!nickname) return;

  localStorage.setItem("mp_nick", nickname);
  router.push("/campaigns");
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">📍</div>

      <h1>MapPin</h1>

      <input
        v-model="nicknameInput"
        class="login-input"
        placeholder="Enter your nickname"
        maxlength="20"
        autofocus
        @keyup.enter="confirmNickname"
      />

      <button
        class="btn-primary"
        :disabled="!nicknameInput.trim()"
        @click="confirmNickname"
      >
        Enter →
      </button>
    </div>
  </div>
</template>
