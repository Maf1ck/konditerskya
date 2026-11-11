<script setup lang="ts">
import { ref, useId } from 'vue'
import { usePwaInstall } from '@/composables/usePwaInstall'

defineProps<{ tone?: 'light' | 'dark' }>()

const { canPrompt, needsIosHint, install } = usePwaInstall()
const hintOpen = ref(false)
const hintId = useId()
</script>

<template lang="pug">
.install(v-if="canPrompt || needsIosHint" :class="`install--${tone ?? 'light'}`")
  button.install__button(v-if="canPrompt" type="button" @click="install")
    span.install__icon(aria-hidden="true")
    | Встановити застосунок
  template(v-else)
    button.install__button(
      type="button"
      :aria-expanded="hintOpen"
      :aria-controls="hintId"
      @click="hintOpen = !hintOpen"
    )
      span.install__icon(aria-hidden="true")
      | Встановити застосунок
    p.install__hint(v-show="hintOpen" :id="hintId")
      | У Safari натисніть «Поділитися»
      span.install__share(aria-hidden="true")
      | і виберіть «На екран „Додому“». Іконка з’явиться поруч з іншими застосунками.
</template>

<style lang="scss" scoped>
.install {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: $s-8;

  &__button {
    display: inline-flex;
    align-items: center;
    gap: $s-8;
    padding: 10px $s-16;
    border: 1px solid currentColor;
    border-radius: $r-pill;
    font-size: 14px;
    font-weight: 700;
    transition:
      background-color 0.2s,
      color 0.2s;

    &:focus-visible {
      @include focus-ring;
    }
  }

  // Phone with a download arrow, drawn in CSS so it follows the text color.
  &__icon {
    position: relative;
    width: 12px;
    height: 18px;
    border: 2px solid currentColor;
    border-radius: 3px;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 2px;
      width: 4px;
      height: 4px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: translateX(-50%) rotate(45deg);
    }
  }

  &__hint {
    max-width: 320px;
    font-size: 14px;
    line-height: 1.5;
  }

  // Share glyph of iOS Safari: a box with an arrow pointing up.
  &__share {
    position: relative;
    display: inline-block;
    width: 12px;
    height: 12px;
    margin: 0 6px;
    border: 2px solid currentColor;
    border-top: 0;
    border-radius: 0 0 2px 2px;
    vertical-align: -1px;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 3px;
      width: 2px;
      height: 12px;
      background: currentColor;
      transform: translateX(-50%);
    }

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: -7px;
      width: 5px;
      height: 5px;
      border-top: 2px solid currentColor;
      border-left: 2px solid currentColor;
      transform: translateX(-50%) rotate(45deg);
    }
  }

  &--light {
    color: $c-ink;

    .install__button {
      @include hover-only {
        background: $c-ink;
        color: $c-bg;
      }
    }

    .install__hint {
      color: $c-muted;
    }
  }

  &--dark {
    color: $c-bg;

    .install__button {
      @include hover-only {
        background: $c-bg;
        color: $c-ink-dark;
      }
    }

    .install__hint {
      color: $c-on-dark;
    }
  }
}
</style>
