
function openNav() {
    // Check if mobile view (you can adjust 900px as needed)
    const isMobile = window.innerWidth <= 900;
    
    // Set different widths for mobile vs desktop
    const navWidth = isMobile ? "80%" : "40%";
    // const marginAdjustment = isMobile ? "80%" : "200px";
    
    // Apply styles
    document.getElementById("mySidenav").style.width = navWidth;
    document.getElementById("main").style.marginRight = marginAdjustment;
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginRight = "0";
}