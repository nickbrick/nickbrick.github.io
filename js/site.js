function openModal(id) {
    var modal = $("#modal-" + id);
    modal.css("display", "block");
    modal.css("overflow", "hidden");
}

function closeModal(id) {
    console.log(event);
    let modal = $('#modal-' + id);
    if (event.target == modal[0]
        || event.target == $(`#modal-${id} .close-button`)[0]) {
        modal.removeAttr("style");
    }
}

function getScrollFraction(selector) {
    var s = $(selector).prop("scrollTop"),
        d = $(selector).prop("scrollHeight"),
        c = $(selector).prop("offsetHeight");

    var scrollFraction = s / (d - c);

    return scrollFraction;
}

function scrollToSection(selector) {
    $("#scroll-container")[0].scrollTo({
        top: $(selector).offset().top
            - $("#scroll-container").children().first().offset().top
            - 20,
        behavior: "smooth",
    });
}

$("#scroll-container").scroll(function () {
    //$("#video-bg")[0].currentTime = $("#video-bg")[0].duration * getScrollFraction("#scroll-container") * 0.7;

});

$(function () {
    const m = "a2FtemVsYXNuQGdtYWlsLmNvbQ==";
    const aa = document.getElementsByClassName("mail");
    for (var i = 0; i < aa.length; i++) {
        aa[i].setAttribute("href", "mailto:" + atob(m));
    };
});

var lastObserver, projectsObserver, ideasObserver;
$(function () {
    let options = {
        root: null,
        rootMargin: "-25% 0px -65%",
        threshold: 0.01,
    };
    projectsObserver = new IntersectionObserver(handleIntersect, options);
    ideasObserver = new IntersectionObserver(handleIntersect, options);
    projectsObserver.id = "#projects";
    ideasObserver.id = "#ideas";
    projectsObserver.observe($("#projects")[0]);
    ideasObserver.observe($("#ideas")[0]);
    lastObserver = projectsObserver.id;
});

function handleIntersect(entries, observer) {
    if (!entries[0].isIntersecting) return;
    if (lastObserver != observer.id) {
        let videoId;
        if (observer.id == "#projects") {
            videoId = "#video-up";
            $("#video-down").hide();
        }
        else if (observer.id == "#ideas") {
            videoId = "#video-down";
            $("#video-down").show();
        }
        $(videoId)[0].play();
    lastObserver = observer.id;
    }
}