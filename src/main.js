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
            $(img).attr("src", "assets/images/cartanauticabw.jpg")
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
            const lineOpacity = Math.max(1 - (currentTime - thisItem.time) / 200, 0)
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

    $('#container').imagesLoaded(
        function(){
            console.log("images loadedd");
            setTimeout(function() {
                $('#projectSection').masonry({
                    // options
                    itemSelector: '.projectContainer'
                });
            }, 1000)
        }
    );


    //Workaround for resize bug in locomotive js
    window.setTimeout(delayedResize, 1500);

    let userResized = true;
    $( window ).resize(function() {
        console.log("resized");
        if(userResized){
            userResized = false;
            delayedResize();
        } else {
            userResized = true;
        }
    });
});

function delayedResize(){
    window.setTimeout(function(){
        window.dispatchEvent(new Event('resize'));
    }, 1000);
}


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