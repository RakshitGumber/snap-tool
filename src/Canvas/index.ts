import { Application } from "pixi.js";

export const addCanvas = async (element: string) => {
  const app = new Application();

  const elem = document.querySelector(element) as HTMLElement;
  await app.init({ background: "#1099bb", resizeTo: elem });
  elem.appendChild(app.canvas);
};
