<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { formatPrice, pluralize } from '@/composables/useFormat'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const route = useRoute()

// No point in a shortcut to the cart while already on the cart or right after ordering.
const HIDDEN_ON = new Set(['cart', 'order-success'])
// `matched` is empty until the first navigation resolves, which avoids a flash on a direct /cart load.
const visible = computed(
  () => cart.totalQty > 0 && route.matched.length > 0 && !HIDDEN_ON.has(String(route.name)),
)

const badge = computed(() => (cart.totalQty > 99 ? '99+' : String(cart.totalQty)))
const label = computed(
  () =>
    `Кошик: ${cart.totalQty} ${pluralize(cart.totalQty, ['товар', 'товари', 'товарів'])} на ${formatPrice(cart.total)}`,
)

// A short pulse each time something is added, so the user sees where the item went.
const pulse = ref(false)
watch(
  () => cart.totalQty,
  (now, before) => {
    if (now <= before) return
    pulse.value = false
    requestAnimationFrame(() => (pulse.value = true))
  },
)
</script>

<template lang="pug">
transition(name="fab")
  router-link.fab(
    v-if="visible"
    :to="{ name: 'cart' }"
    :aria-label="label"
    :title="label"
    :class="{ 'is-pulse': pulse }"
    @animationend="pulse = false"
  )
    svg.fab__icon(viewBox="0 0 24 24" aria-hidden="true")
      path(d="M8.5 10 11 4.5M15.5 10 13 4.5")
      path(d="M3 10h18")
      path(d="m4.5 10 1.5 8.3A2 2 0 0 0 8 20h8a2 2 0 0 0 2-1.7l1.5-8.3")
      path(d="M9.5 13.5v3M12 13.5v3M14.5 13.5v3")
    span.fab__badge(:key="cart.totalQty") {{ badge }}
</template>

<style lang="scss" scoped>
.fab {
  position: fixed;
  right: var(--gutter);
  bottom: calc(#{$s-16} + env(safe-area-inset-bottom, 0px));
  z-index: 50;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: $c-ink;
  color: $c-bg;
  box-shadow:
    0 10px 24px color-mix(in srgb, #{$c-ink-dark} 28%, transparent),
    0 2px 6px color-mix(in srgb, #{$c-ink-dark} 18%, transparent);
  transition:
    background-color 0.2s,
    transform 0.2s;
  @include up($bp-md) {
    bottom: calc(#{$s-24} + env(safe-area-inset-bottom, 0px));
    width: 64px;
    height: 64px;
  }

  @include hover-only {
    background: $c-ink-dark;
    transform: translateY(-2px);
  }

  &:focus-visible {
    @include focus-ring;
  }

  &.is-pulse {
    animation: fab-pulse 0.5s ease;
  }

  &__icon {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 26px;
    height: 26px;
    padding: 0 $s-4;
    border: 2px solid $c-bg;
    border-radius: $r-pill;
    background: $c-accent;
    color: $c-ink-dark;
    font-size: 13px;
    font-weight: 800;
    line-height: 22px;
    text-align: center;
    animation: pop 0.4s ease;
  }
}

@keyframes fab-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, #{$c-accent} 55%, transparent);
  }
  100% {
    box-shadow: 0 0 0 18px color-mix(in srgb, #{$c-accent} 0%, transparent);
  }
}

.fab-enter-active,
.fab-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .fab,
  .fab__badge {
    animation: none !important;
    transition: none;
  }
}
</style>
