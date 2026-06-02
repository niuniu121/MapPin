import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../components/LoginPage.vue";
import CampaignList from "../components/CampaignList.vue";
import MapView from "../components/MapView.vue";

const routes = [
    {
        path: "/",
        redirect: "/campaigns",
    },
    {
        path: "/login",
        component: LoginPage,
    },
    {
        path: "/campaigns",
        component: CampaignList,
    },
    {
        path: "/map/:id",
        component: MapView,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to) => {
    const nickname = localStorage.getItem("mp_nick");

    if (to.path !== "/login" && !nickname) {
        return "/login";
    }

    if (to.path === "/login" && nickname) {
        return "/campaigns";
    }
});

export default router;