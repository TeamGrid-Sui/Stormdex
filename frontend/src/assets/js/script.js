/* Set the width of the side navigation to 250px and the left margin of the page content to 250px and add a black background color to body */
// function openNav() {
//     document.getElementById("mySidenav").style.width = "200px";

//     document.getElementById("main").style.marginRight = "200px";
//     document.body.style.backgroundColor = "black";
// }
function openNav() {
    // Check if mobile view (you can adjust 900px as needed)
    const isMobile = window.innerWidth <= 900;
    
    // Set different widths for mobile vs desktop
    const navWidth = isMobile ? "100%" : "200px";
    const marginAdjustment = isMobile ? "100%" : "200px";
    
    // Apply styles
    document.getElementById("mySidenav").style.width = navWidth;
    document.getElementById("main").style.marginRight = marginAdjustment;
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginRight = "0";
    document.getElementById("mySidenav").style.backgroundColor="blue"
}