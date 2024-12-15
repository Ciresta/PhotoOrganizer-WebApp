(function () {
    // Dynamically load Swiper CSS and JS
    const loadSwiper = () => {
      return new Promise((resolve, reject) => {
        // Load Swiper CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/swiper/swiper-bundle.min.css";
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
  
        // Load Swiper JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/swiper/swiper-bundle.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
  
    // Create and initialize the carousel
    const createCarousel = async (slideshowId, container) => {
      try {
        const response = await fetch(`https://photo-org-app.onrender.com/getslideshow/${slideshowId}?minimal=true`, {
          method: 'GET',
          credentials: 'include',  // Make sure credentials are sent if needed
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch slideshow');
        }
  
        const data = await response.json();
        const photoUrls = data.photoUrls || [];
  
        if (photoUrls.length === 0) {
          container.innerHTML = "<p>No images available</p>";
          return;
        }
  
        // Create carousel structure
        const swiperContainer = document.createElement("div");
        swiperContainer.className = "swiper";
        swiperContainer.style.marginBottom = "50px"; // Adds space for watermark
  
        const swiperWrapper = document.createElement("div");
        swiperWrapper.className = "swiper-wrapper";
  
        photoUrls.forEach((url) => {
          const slide = document.createElement("div");
          slide.className = "swiper-slide";
          slide.style.position = "relative";
  
          const img = document.createElement("img");
          img.src = url;
          img.style.width = "100%";  // Full width of the slide
          img.style.height = "300px"; // Fixed height for uniformity
          img.style.objectFit = "cover"; // Ensure images cover the area without distortion
          img.style.borderRadius = "8px"; // Rounded corners
          img.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // Premium shadow effect
  
          // Add watermark to the bottom right of each image
          const watermark = document.createElement("div");
          watermark.className = "watermark";
          watermark.innerText = "Made with PhotoApp";
          watermark.style.position = "absolute";
          watermark.style.bottom = "10px";
          watermark.style.right = "10px";
          watermark.style.fontSize = "14px";
          watermark.style.color = "rgba(255, 255, 255, 0.7)";
          watermark.style.fontWeight = "bold";
          watermark.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
          watermark.style.padding = "5px 10px";
          watermark.style.borderRadius = "5px";
  
          slide.appendChild(img);
          slide.appendChild(watermark);
          swiperWrapper.appendChild(slide);
        });
  
        swiperContainer.appendChild(swiperWrapper);
        container.appendChild(swiperContainer);
  
        // Initialize Swiper with 3 images per view and other premium settings
        new Swiper(swiperContainer, {
          spaceBetween: 20, // Space between images
          slidesPerView: 3, // Show 3 images at a time
          pagination: {
            clickable: true,
            el: ".swiper-pagination",
            dynamicBullets: true,
          },
          navigation: true,
          loop: true, // Infinite loop
          autoplay: {
            delay: 5000, // Auto slide every 5 seconds
            disableOnInteraction: false,
          },
          breakpoints: {
            // Responsive behavior for smaller screens
            1024: {
              slidesPerView: 3,
            },
            768: {
              slidesPerView: 2,
            },
            480: {
              slidesPerView: 1,
            },
          },
        });
  
      } catch (error) {
        console.error('Error loading slideshow:', error);
        container.innerHTML = "<p>Failed to load slideshow</p>";
      }
    };
  
    // Public function to initialize slideshow
    window.initSlideshow = async (slideshowId, elementId) => {
      const container = document.getElementById(elementId);
      if (!container) {
        console.error("Container element not found");
        return;
      }
  
      try {
        // Wait for Swiper to be loaded before creating the carousel
        await loadSwiper();
        createCarousel(slideshowId, container);
      } catch (error) {
        console.error("Failed to load Swiper:", error);
      }
    };
  })();
  