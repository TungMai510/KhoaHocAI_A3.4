const lessonLink = document.querySelector('#hoc-lieu');
const lessonUrl = new URL(lessonLink.href);
lessonUrl.search = window.location.search;
lessonUrl.hash = window.location.hash;
lessonLink.href = lessonUrl.href;
window.location.replace(lessonUrl.href);
