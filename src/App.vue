<template>
  <h2>人工修改流式结果</h2>
  <div ref="panelRef" class="panel" />

  <div style="margin-top: 20px; margin-bottom: 10px">
    <button size="small" @click="setMode('crosshair')">crosshair</button>
    <button size="small" @click="setMode('rect')">rect</button>
    <button size="small" @click="setMode('polygon')">polygon</button>
    <button size="small" @click="setMode(undefined)">undefined</button>
    <button size="small" @click="remove">clear</button>
  </div>

  <div ref="panelRef2" class="panel" style="margin-top: 20px" />
</template>

<script setup lang="ts">
// 建议把这个逻辑写到BaseAnno里面去
import KmflowPolygon from "./flowUtils/AiAnno/KmAnno";
import KmflowManualAnno from "./flowUtils/ManualAnno/ManualAnno";

const labelConst = ["0", "256", "512", "768", "1024"];
const labelLog = ["10^0", "10^1", "10^2", "10^3", "10^4"].reverse();

const x = "FSC-A";
const y = "CD3 FITC-A::FITC-A";

import { computed, ref, onMounted } from "vue";

const xLabels = computed(() => {
  if (["FSC-A", "SSC-A"].includes(x)) return labelConst;
  return labelLog;
});
const yLabels = computed(() => {
  if (["FSC-A", "SSC-A"].includes(y)) return labelConst;
  return labelLog;
});
const panelRef = ref();
const panelRef2 = ref();

const instance = ref();

const polygonList = [
  [
    { x: 336, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 1024 },
    { x: 403, y: 183 },
  ],
  [
    { x: 0, y: 1024 },
    { x: 734, y: 1024 },
    { x: 584, y: 200 },
    { x: 403, y: 183 },
  ],
  [
    { x: 734, y: 1024 },
    { x: 1024, y: 1024 },
    { x: 1024, y: 365 },
    { x: 584, y: 200 },
  ],
  [
    { x: 403, y: 183 },
    { x: 336, y: 0 },
    { x: 610, y: 0 },
    { x: 584, y: 200 },
  ],
  [
    { x: 584, y: 200 },
    { x: 610, y: 0 },
    { x: 1024, y: 0 },
    { x: 1024, y: 365 },
  ],
];

const manualAnnoInstance = ref();
function setMode(mode: KmflowManualAnno["drawMode"]) {
  manualAnnoInstance.value.setDrawMode(mode);
}

function remove() {
  manualAnnoInstance.value.removePolygon();
}

onMounted(async () => {
  instance.value = new KmflowPolygon();
  // 这里等待接口数据返回
  await instance.value.init(panelRef.value, xLabels.value, yLabels.value, "pic1.jpg", polygonList);

  manualAnnoInstance.value = new KmflowManualAnno();
  await manualAnnoInstance.value.init(panelRef2.value, xLabels.value, yLabels.value, "pic2.jpg", {
    x: 500,
    y: 700,
  });
});
</script>

<style lang="css" scoped>
.panel {
  width: 400px;
  height: 400px;
}
</style>
