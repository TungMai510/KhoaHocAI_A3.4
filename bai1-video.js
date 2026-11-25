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
