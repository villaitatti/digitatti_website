$(document).ready(function(){
    $("a").on('click', function(event) {
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();
            var hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 1000, function(){
                window.location.hash = hash;
            });
        }
    });
    showProjects();
    showFellows();


// Wrap every letter in a span
    var textWrapper = document.querySelector('.ml11 .letters');
    textWrapper.innerHTML = textWrapper.textContent.replace(/([^\x00-\x80]|\w)/g, "<span class='letter'>$&</span>");


    setTimeout(function(){
        anime.timeline({loop: false})
            .add({
                targets: '.ml11 .line',
                scaleY: [0,1],
                opacity: [0.5,1],
                easing: "easeOutExpo",
                duration: 700
            })
            .add({
                targets: '.ml11 .line',
                translateX: [0, document.querySelector('.ml11 .letters').getBoundingClientRect().width + 10],
                easing: "easeOutExpo",
                duration: 700,
                delay: 100
            }).add({
            targets: '.ml11 .letter',
            opacity: [0,1],
            easing: "easeOutExpo",
            duration: 600,
            offset: '-=775',
            delay: (el, i) => 34 * (i+1)
        }).add({
            targets: '.line',
            opacity: 0,
            duration: 600,
            easing: "easeOutExpo",
            delay: 600
        });

        setTimeout(function(){$('#subtitle').animate({
            'margin-bottom': '15px', 'opacity': '1'
        }, {duration: 1500, queue: false}, function() {
            // Animation complete.
        });}, 1000);


    }, 800);


    $('.projectContainer').click(function(){
        fillProjectModal(this);
    });

    $('.fellowContainer').click(function(){
        fillFellowModal(this);
    });

    var arcanimation = document.getElementById('arcanimation');
    // Set up our animation

    var animData = {
        container: arcanimation,
        renderer: 'svg',
        autoplay: true,
        loop: false,
        path : 'assets/images/logoanimated1.json'
    };
    var anim = bodymovin.loadAnimation(animData);
});


function showProjects(){
    $.each(projects, function(k,v){
        let projecthtml = "<div class='projectContainer'>";
        projecthtml += "<img class='projectImage' src='assets/images/projects/" + v.picture +"'>";
        projecthtml += "<p class='projectTitle'>" + v.title + "</p>";
        projecthtml += "<p class='projectDescription' style='display:none;'>" + v.description + "</p>";
        projecthtml += "</div>";

        $('#projectsContainer').append(projecthtml);
    });
}

function showFellows(){
    $.each(fellows, function(k,v){
        let fellowhtml = "<div class='fellowContainer justify-content-center'>";
        fellowhtml += `<img class='fellowImage mx-auto' src='assets/images/fellows/${v.picture}'>`;
        fellowhtml += "<p class='fellowName'>" + v.name + "</p>";
        fellowhtml += "<p class='fellowTitle' style='display:none;'>" + v.title + "</p>";
        fellowhtml += "<p class='fellowBio' style='display:none;'>" + v.bio + "</p>";
        fellowhtml += "</div>";

        $('#fellowsContainer').append(fellowhtml);
    });
}


function fillProjectModal(project){
    let projectModal = $("#projectModal");
    let image = $(project).find('.projectImage').attr("src");
    let title = $(project).find('.projectTitle').text();
    let desc = $(project).find('.projectDescription').text();

    $('#projectModalImage').attr("src", image);
    $('#projectModalTitle').text(title);
    $('#projectModalDescription').text(desc);

    projectModal.modal('show');
}

function fillFellowModal(fellow){
    let fellowModal = $("#fellowModal");
    let image = $(fellow).find('.fellowImage').attr("src");
    let title = $(fellow).find('.fellowTitle').text();
    let name = $(fellow).find('.fellowName').text();
    let bio = $(fellow).find('.fellowBio').text();

    $('#fellowModalImage').attr("src", image);
    $('#fellowModalTitle').text(title);
    $('#fellowModalBio').text(bio);
    $('#fellowModalName').text(name);

    fellowModal.modal('show');
}