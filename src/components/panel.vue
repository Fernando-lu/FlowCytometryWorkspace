<template>
  <div ref="panelRef" v-loading="loading" class="panel" />
</template>

<script setup lang="ts">
import { Application, BitmapText, Container, Graphics, Rectangle, TextStyle } from "pixi.js";
import TbnkChart from "../utils/index";

import { ref, toRefs, computed, onMounted } from "vue";
const props = defineProps({
  x: { type: String, default: "" },
  y: { type: String, default: "" },
  dotList: { type: Array, default: () => [] },
});

const { x, y, dotList } = toRefs(props);
const panelRef = ref();

const app = ref();
const container = ref<Container>();

const loading = TbnkChart.loading;

// 当轴为FSC-A,SSC-A时，是
// 否则为指数递增
const labelConst = ["0", "256", "512", "768", "1024"];
const labelLog = ["10^0", "10^1", "10^2", "10^3", "10^4"].reverse();

const xLabels = computed(() => {
  if (["FSC-A", "SSC-A"].includes(x.value)) return labelConst;
  return labelLog;
});
const yLabels = computed(() => {
  if (["FSC-A", "SSC-A"].includes(y.value)) return labelConst;
  return labelLog;
});

// 视图区域大概是340px
const dotVisibleSize = 340;
const StageSize = 400;
const marginLeft = 30;
const marginTop = 30;

onMounted(async () => {
  app.value = new Application();
  await app.value.init({
    width: StageSize,
    height: StageSize,
    backgroundColor: 0xd9f9e3,
    antialias: true,
    resolution: 1,
    preference: "webgl",
  });

  panelRef.value?.appendChild(app.value.canvas);
  renderAxisLabels();

  container.value = new Container();
  // 确认好container的实际距离，用实际距离免得计算点的位置，渲染出来后再统一scale即可
  container.value.width = 1024;
  container.value.height = 1024;
  container.value.scale = dotVisibleSize / 1024;
  // 固定好container的位置
  container.value.x = marginLeft + 1;
  container.value.y = marginTop - 1;
  app.value.stage.addChild(container.value);

  // 初始化纹理，用sprite替代重复绘制图形有更好的性能
  const circleBase = new Graphics().circle(0, 0, 2).fill(0xff0000);
  const circleSelected = new Graphics().circle(0, 0, 2).fill(0x00ff00);
  // 在这里进行赋值，实际生产建议有一个方法进行赋值
  TbnkChart.texture = app.value.renderer.generateTexture(circleBase);
  TbnkChart.textureSelected = app.value.renderer.generateTexture(circleSelected);

  TbnkChart.renderDot(app.value, container.value, dotList.value, x.value, y.value);
  bindingEvent();
});

// 画坐标轴
const textStyle = new TextStyle({
  fill: 0x000000,
  fontSize: 12,
});

function renderAxisLabels() {
  const container = new Container();
  app.value.stage.addChild(container);
  container.x = marginLeft;
  container.y = marginTop;
  const graphics = new Graphics();
  graphics
    .moveTo(0, 0)
    .lineTo(0, dotVisibleSize)
    .lineTo(dotVisibleSize, dotVisibleSize)
    .stroke({ width: 1, color: 0x000000 });
  container.addChild(graphics);

  // 写字
  const gap = dotVisibleSize / (xLabels.value.length - 1);
  for (let i = 0; i < xLabels.value.length; i++) {
    const label = new BitmapText({
      text: xLabels.value[i],
      style: textStyle,
    });

    label.x = gap * i;
    label.y = 345;
    // todo: 这里要设置居中

    container.addChild(label);
  }

  const gapY = dotVisibleSize / (yLabels.value.length - 1);
  for (let i = 0; i < yLabels.value.length; i++) {
    const label = new BitmapText({
      text: yLabels.value[i],
      style: textStyle,
    });

    label.x = -30;
    label.y = gapY * i;
    // todo: 这里要设置居中

    container.addChild(label);
  }
}

// 给container绑定事件。
// 当前版本我实现是的画矩形，实际情况根据需求来实现吧
let drawing = false;

function bindingEvent() {
  if (!container.value) return;
  container.value.interactive = true;
  // 允许整个container都支持点击
  container.value.hitArea = new Rectangle(0, 0, 1024, 1024);
  container.value.on("mousedown", (event) => {
    // 没有按着shift键的不处理，只有按下shift键才算开始绘制
    if (!event.shiftKey) return;
    event.preventDefault();
    drawing = true;
    const local = container.value!.toLocal(event.global);
    TbnkChart.drawRect(container.value!, local.x, local.y);
  });

  container.value.on("mousemove", (event) => {
    // 没有按着shift键的不处理，只有按下shift键才算开始绘制
    if (!drawing || !event.shiftKey) return;
    const local = container.value!.toLocal(event.global);
    TbnkChart.updateRect(container.value!, local.x, local.y);
  });

  container.value.on("mouseup", () => {
    if (drawing) {
      drawing = false;
    }
    console.log(TbnkChart.labelInfo);
    TbnkChart.submit(app.value, container.value!, dotList.value, x.value, y.value);
    // 提交到其他的流式图片中去
  });
}
</script>

<style lang="css" scoped>
.panel {
  width: 400px;
  height: 400px;
}
</style>
