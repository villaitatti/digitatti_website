$(document).ready(function(){

    showProjects();

    // init Masonry
    var $grid = $('.grid').masonry({
        itemSelector: '.grid-item',
        percentPosition: true,
        columnWidth: '.grid-sizer'
    });

    // layout Masonry after each image loads
    $grid.imagesLoaded().progress( function() {
        $grid.masonry();
    });

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

    showFellows();

    /* ABOUT CANVAS EFFECT */

    /*
// defining variables
// c and h are canvases, f and b are contexts
    let c, h, f, b, img, mouseX = null,
        mouseY = null,
        array = [],
        startTime = 0,
        over500msElapsed = true

    $("body").mousemove((e) => {
        mouseX = e.clientX
        mouseY = e.clientY + (window.pageYOffset - $('#aboutBackground').offset().top);
        startTime = Date.now()
        over500msElapsed || onImageLoad()
    })

// handle mouse leaving window (set null) or resize (rebuild canvases)
    $(window)
        .on("blur mouseout", function() {
            mouseX = mouseY = null
        }).on("resize", function() {
        c && c.parentNode && c.parentNode.removeChild(c)
        setUpCanvases()
    })

    setUpCanvases()

    function setUpCanvases() {
        const bodyWidth = $("body").width()
        const bodyHeight = $("#aboutSection").height()
        c = document.createElement("canvas")
        c.width = bodyWidth
        c.height = bodyHeight
        c.style.backgroundColor = "white"
        c.style.position = "absolute"
        c.style.top = 0
        c.style.left = 0
        $("#aboutBackground").append(c)
        h = document.createElement("canvas")
        h.width = bodyWidth
        h.height = bodyHeight
        // set up contexts
        if (c.getContext && c.getContext("2d") && (f = c.getContext("2d"),
            b = h.getContext("2d"), b.lineCap = "round", b.shadowColor = "#000", !img)) {
            // loads image (never added to DOM) so that it can be added to canvas (browser only needs to download it once)
            img = new Image
            // add listener before setting source so it will definitely capture the event
            $(img).one("load", onImageLoad)
            $(img).attr("src", "assets/images/granaio.jpg")
        }
    }


    function onImageLoad() {
        let currentTime = Date.now()
        over500msElapsed = currentTime > startTime + 500 ? false : true

        // push to start of array
        mouseX && over500msElapsed && array.unshift({
            time: currentTime,
            x: mouseX,
            y: mouseY + $("body").scrollTop()
        })

        // trims array - removes all items older than 1s
        for (let i = 0; i < array.length; i++) {
            if (currentTime - array[i].time > 1000) {
                array.length = i
            }
        }

        if (array.length > 0) {
            requestAnimationFrame(onImageLoad)
        }

        // clear canvas2 by its own width and height
        b.clearRect(0, 0, h.width, h.height)


        // loop through each item in array
        for (i = 1; i < array.length; i++) {
            const thisItem = array[i]
            const lastItem = array[i - 1]

            // fading stroke over time
            const lineOpacity = Math.max(1 - (currentTime - thisItem.time) / 1000, 0)
            b.strokeStyle = `rgba(0,0,0,${lineOpacity})`
            b.lineWidth = 250
            b.beginPath()
            b.moveTo(lastItem.x, lastItem.y)
            b.lineTo(thisItem.x, thisItem.y)
            b.stroke()
        }

        // adjusting for canvas ratio
        let imageRatio1 = c.width
        let imageRatio2 = c.width / img.naturalWidth *
            img.naturalHeight
        imageRatio2 < c.height && (imageRatio2 = c.height, imageRatio1 = c.height / img.naturalHeight * img.naturalWidth)

        // drawing the images
        // draw image onto f
        f.drawImage(img, 0, 0, imageRatio1, imageRatio2)
        // set "destination-in" temporarily: when f and h overlap, f is kept (h acts as a mask for the image)
        f.globalCompositeOperation = "destination-in"
        // add h as mask
        f.drawImage(h, 0, 0)
        // reset to normal composite operation
        f.globalCompositeOperation = "source-over"
    }

    /!* ABOUT CANVAS EFFECT CLOSE *!/*/

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


    var scroll = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: true
    });

    $('#arrowContainer').click(function(){
       scroll.scrollTo(document.querySelector('#aboutSection'));
    });

    


    //Workaround for resize bug in locomotive js
    window.setTimeout(delayedResize, 1500);

    //startColorAnimation(200);

    if(window.matchMedia("(max-width: 767px)").matches){
        $('.projectImage').each(function(k, element){
        $(element).css('filter', 'grayscale(0%)');
        });
    } else {
        const distanceTreshold = 700;
        $(document).mousemove(function(e){
            $('.projectImage').each(function(k, element){
                var distance = calculateDistance($(element), e.pageX, e.pageY);
                if (distance < distanceTreshold){
                    let scaled = scale(distance, 0 , distanceTreshold,0, 100);
                    $(element).css('filter', 'grayscale('+scaled + 50 + '%)');

                }
            });
        });
    }

    let userResized = true;
    $( window ).resize(function() {
        if(userResized){
            userResized = false;
            delayedResize();
        } else {
            userResized = true;
        }
    });

    if (window.location.hash !== "") {
        $(window.location.hash).click();
    }

    $('#projectModal').on('hidden.bs.modal', function(){
        window.location.hash = "";
    });
});

function calculateDistance(elem, mouseX, mouseY) {
    return Math.floor(Math.sqrt(Math.pow(mouseX - (elem.offset().left+(elem.width()/2)), 2) + Math.pow(mouseY - (elem.offset().top+(elem.height()/2)), 2)));
}

const scale = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function delayedResize(){
    window.setTimeout(function(){
        window.dispatchEvent(new Event('resize'));
    }, 1000);
}


function showProjects(){

    for(const v of projects) {
        
        const size = typeof v.size == 'undefined' ? 'default' : 'big';

        let projectId = v.picture.split(".")[0].replace("personal/", "");
        let projecthtml = "<div id='" + projectId +"' class='projectContainer grid-item "+size+"'>";

        projecthtml += "<img class='projectImage' src='assets/images/projects/" + v.picture +"'>";
        
        projecthtml += "<p class='projectTitle'>" + v.title + "</p>";
        projecthtml += "<p class='projectDescription' style='display:none;'>" + v.description + "</p>";
        projecthtml += "<p class='projectWebsite' style='display:none;'>" + v.website + "</p>";
        projecthtml += "<p class='projectGithub' style='display:none;'>" + v.github + "</p>";
        projecthtml += "<p class='projectDocumentation' style='display:none;'>" + v.documentation + "</p>";
        projecthtml += "<p class='projectStatus' style='display:none;'>" + v.status + "</p>";
        //If the project is a personal project
        if("fellow" in v){
            projecthtml += "<p class='projectFellow' style='display:none;'>" + v.fellow + "</p>";
        }
        projecthtml += "</div>";

        $('.grid').append(projecthtml);
    }
    
}

function startColorAnimation(timeout){
    let projectsNumber = $('.projectImage').length;
    window.setInterval(function(){
        var randomNumber = Math.floor(Math.random() * (projectsNumber + 1));
        $('.projectImage').eq(randomNumber).addClass("coloredProject").removeClass("monochromeProject");

        setTimeout(function(){
            $('.projectImage').eq(randomNumber).removeClass("coloredProject").addClass("monochromeProject");
            }, 2000);
    }, timeout);
}

function showFellows(){

    for(const v of fellows){
        let fellowhtml = "<div class='fellowContainer justify-content-center'>";
        fellowhtml += `<img class='fellowImage mx-auto' src='assets/images/fellows/${v.picture}'>`;
        fellowhtml += "<p class='fellowName'>" + v.name + "</p>";
        fellowhtml += "<p class='fellowTitle' style='display:none;'>" + v.title + "</p>";
        fellowhtml += "<p class='fellowBio' style='display:none;'>" + v.bio + "</p>";
        fellowhtml += "</div>";

        $('#fellowsContainer').append(fellowhtml);
    }
}


function fillProjectModal(project){
    let projectModal = $("#projectModal");
    let image = $(project).find('.projectImage').attr("src");
    let title = $(project).find('.projectTitle').html();
    let desc = $(project).find('.projectDescription').html();
    let fellow = $(project).find('.projectFellow').html();
    console.log(fellow);
    let website = $(project).find('.projectWebsite').html();
    let github = $(project).find('.projectGithub').html();
    let documentation = $(project).find('.projectDocumentation').html();
    let status = $(project).find('.projectStatus').html();

    $('#projectModalImage').attr("src", image);
    $('#projectModalTitle').html(title);
    $('#projectModalDescription').html(desc);

    fellow !== undefined? $('#projectModalFellow').html(fellow) : alert(fellow);
    status !== undefined? $('#projectModalStatus').html("Project status: " + status) : $('#projectModalStatus').html("");
    website !== undefined? $('#projectModalWebsite').attr('href', website).html("Website →") : $('#projectModalWebsite').html("");
    github !== undefined? $('#projectModalGithub').attr('href', github).html("Github →") : $('#projectModalGithub').html("");
    documentation !== undefined? $('#projectModalDocumentation').attr('href', documentation).html("Documentation →") : $('#projectModalDocumentation').html("");

    window.location.hash = $(project).attr("id");
    projectModal.modal('show');
}

function fillFellowModal(fellow){
    let fellowModal = $("#fellowModal");
    let image = $(fellow).find('.fellowImage').attr("src");
    let title = $(fellow).find('.fellowTitle').html();
    let name = $(fellow).find('.fellowName').html();
    let bio = $(fellow).find('.fellowBio').html();

    $('#fellowModalImage').attr("src", image);
    $('#fellowModalTitle').html(title);
    $('#fellowModalBio').html(bio);
    $('#fellowModalName').html(name);

    fellowModal.modal('show');
}