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
});


function showProjects(){
    $.each(projects, function(k,v){
        let projecthtml = "<div class='projectContainer'>";
        projecthtml += "<img class='projectImage' src='assets/images/projects/" + v.picture +"'>";
        projecthtml += "<p class='projectTitle'>" + v.title + "</p>";
        projecthtml += "</div>";

        $('#projectsContainer').append(projecthtml);
    });
}