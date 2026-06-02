export const PALETTE = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
];

export function getColor(str) {
    if (!str) return PALETTE[0];

    let h = 0;

    for (const c of str) {
        h = c.charCodeAt(0) + ((h << 5) - h);
    }

    return PALETTE[Math.abs(h) % PALETTE.length];
}