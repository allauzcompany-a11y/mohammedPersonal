const profileLinks = [
  { label: "Instagram", mark: "IG", href: "", wide: false },
  { label: "LinkedIn", mark: "IN", href: "", wide: false },
  { label: "WhatsApp", mark: "WA", href: "", wide: false },
  { label: "Email", mark: "@", href: "mailto:ceo@lauz.com", wide: false },
  { label: "Website", mark: "WB", href: "", wide: true },
];

document.body.classList.add("js-ready");

const linksGrid = document.getElementById("links-grid");
const planetLayer = document.querySelector(".planet-layer");
const planetVideo = document.getElementById("planet-video");
const planetCanvas = document.getElementById("planet-canvas");

if (linksGrid) {
  profileLinks.forEach((link) => {
    const card = document.createElement("a");
    const isInactive = !link.href;

    card.className = "link-card reveal";
    card.href = link.href || "#";
    card.dataset.inactive = String(isInactive);
    card.dataset.wide = String(Boolean(link.wide));
    card.setAttribute(
      "aria-label",
      isInactive
        ? `${link.label} placeholder`
        : `Open ${link.label} for Mohammed Ahmed Rashid`
    );

    if (isInactive) {
      card.setAttribute("aria-disabled", "true");
      card.addEventListener("click", (event) => event.preventDefault());
    } else {
      card.target = "_blank";
      card.rel = "noreferrer";
    }

    card.innerHTML = `
      <div class="link-topline">
        <span class="link-mark">${link.mark}</span>
        <span class="link-status">
          <span class="status-dot"></span>
          ${isInactive ? "Add URL" : "Live"}
        </span>
      </div>
      <div class="link-main">
        <p class="link-label">${link.label}</p>
        <p class="link-note">${
          isInactive ? "Placeholder card until final link is added." : "Open profile"
        }</p>
      </div>
      <div class="link-bottomline">
        <span class="link-note">${isInactive ? "Replace later" : "Open link"}</span>
        <span class="link-arrow" aria-hidden="true">&#8594;</span>
      </div>
    `;

    linksGrid.appendChild(card);
  });
}

if (planetLayer && planetVideo && planetCanvas) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const planetContext = planetCanvas.getContext("2d", { willReadFrequently: true });
  const PLANET_ZOOM = 1.45;

  if (planetContext && !prefersReducedMotion.matches) {
    let frameWidth = 0;
    let frameHeight = 0;
    let animationId = 0;
    let lastFrameTime = 0;

    const resizePlanetCanvas = () => {
      if (!planetVideo.videoWidth || !planetVideo.videoHeight) {
        return;
      }

      const maxRenderSize = 920;
      const baseSize = Math.min(planetVideo.videoWidth, planetVideo.videoHeight);
      const scale = Math.min(1, maxRenderSize / baseSize);
      const renderSize = Math.max(320, Math.round(baseSize * scale));
      frameWidth = renderSize;
      frameHeight = renderSize;
      planetCanvas.width = frameWidth;
      planetCanvas.height = frameHeight;
    };

    const renderPlanetFrame = (time) => {
      if (!frameWidth || !frameHeight) {
        animationId = window.requestAnimationFrame(renderPlanetFrame);
        return;
      }

      if (time - lastFrameTime < 1000 / 24) {
        animationId = window.requestAnimationFrame(renderPlanetFrame);
        return;
      }

      lastFrameTime = time;
      planetContext.clearRect(0, 0, frameWidth, frameHeight);
      const cropBase = Math.min(planetVideo.videoWidth, planetVideo.videoHeight);
      const cropSize = cropBase / PLANET_ZOOM;
      const cropX = (planetVideo.videoWidth - cropSize) / 2;
      const cropY = (planetVideo.videoHeight - cropSize) / 2;

      planetContext.drawImage(
        planetVideo,
        cropX,
        cropY,
        cropSize,
        cropSize,
        0,
        0,
        frameWidth,
        frameHeight
      );

      const frame = planetContext.getImageData(0, 0, frameWidth, frameHeight);
      const pixels = frame.data;

      for (let i = 0; i < pixels.length; i += 4) {
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        const maxOther = Math.max(red, blue);
        const greenExcess = green - maxOther;
        const greenRatio = green / (maxOther + 1);
        const brightness = Math.max(red, green, blue);

        if (brightness < 18) {
          continue;
        }

        if (greenExcess > 10 && greenRatio > 1.06) {
          const excessRamp = Math.min(1, Math.max(0, (greenExcess - 10) / 78));
          const ratioRamp = Math.min(1, Math.max(0, (greenRatio - 1.06) / 0.64));
          const keyStrength = Math.max(excessRamp, ratioRamp * 0.9);
          const alpha = Math.max(0, Math.round(255 * (1 - keyStrength)));
          const spill = Math.min(1, Math.max(0, (green - (red + blue) / 2) / 130));
          const spillStrength = spill * Math.max(0.35, keyStrength);

          pixels[i] = Math.min(255, red + spillStrength * 32);
          pixels[i + 1] = Math.max(0, green - spillStrength * 150);
          pixels[i + 2] = Math.min(255, blue + spillStrength * 42);
          pixels[i + 3] = alpha < 22 ? 0 : alpha;
        } else if (greenExcess > 4 && greenRatio > 1.015) {
          const softSpill = Math.min(1, Math.max(0, greenExcess / 40));
          pixels[i] = Math.min(255, red + softSpill * 10);
          pixels[i + 1] = Math.max(0, green - softSpill * 42);
          pixels[i + 2] = Math.min(255, blue + softSpill * 16);
        }
      }

      planetContext.putImageData(frame, 0, 0);
      animationId = window.requestAnimationFrame(renderPlanetFrame);
    };

    const startPlanetRender = () => {
      resizePlanetCanvas();
      window.cancelAnimationFrame(animationId);
      animationId = window.requestAnimationFrame(renderPlanetFrame);
    };

    planetVideo.addEventListener("loadedmetadata", startPlanetRender);
    planetVideo.addEventListener("play", startPlanetRender);
    window.addEventListener("resize", resizePlanetCanvas);

    planetVideo.play().catch(() => {
      planetLayer.style.display = "none";
    });
  } else {
    planetLayer.style.display = "none";
  }
}

const revealNodes = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
  }
);

revealNodes.forEach((node) => revealObserver.observe(node));
