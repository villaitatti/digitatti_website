$(document).ready(function(){
    $("a").on('click', function(event) {
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();
            var hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 1500, function(){
                window.location.hash = hash;
            });
        }
    });
    showProjects();
    showFellows();

    $('#mainCol1, #mainCol2').fadeIn(2000).animate({
        'margin-bottom': '5%'
    }, {duration: 1500, queue: false}, function() {
        // Animation complete.
    });
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
        fellowhtml += "<p class='fellowBio' style='display:none;'>" + v.description + "</p>";
        fellowhtml += "</div>";

        $('#fellowsContainer').append(fellowhtml);
    });
}