for (const video of document.querySelectorAll(".lesson-video video")) {
  const observer = new MutationObserver(() => {
    if (video.closest("[hidden]")) video.pause();
  });

  video.addEventListener("play", () => {
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"],
    });
  });
  video.addEventListener("pause", () => observer.disconnect());
  video.addEventListener("error", () => {
    video.hidden = true;
    video.nextElementSibling.hidden = false;
  });
}

for (const intro of document.querySelectorAll("[data-video-target]")) {
  const content = document.getElementById(intro.dataset.videoTarget);
  const button = intro.querySelector("[data-video-continue]");
  let acknowledged = false;

  if (intro.hasAttribute("data-video-start")) {
    intro.hidden = false;
    content.hidden = true;
  }
  if (intro.dataset.videoHash) {
    const showForStep = () => {
      const firstStep = !location.hash || location.hash === intro.dataset.videoHash;
      intro.hidden = acknowledged || !firstStep;
      content.hidden = !intro.hidden;
    };
    showForStep();
    window.addEventListener("hashchange", showForStep);
  }

  button.addEventListener("click", () => {
    acknowledged = true;
    intro.querySelector("video").pause();
    intro.hidden = true;
    content.hidden = false;
    const heading = content.querySelector("h1, h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    content.scrollIntoView({ block: "start" });
  });
}
