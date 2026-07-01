<script>
  import Nav from '$lib/components/Nav.svelte';
  import Hero from '$lib/components/Hero.svelte';
  import PapersBand from '$lib/components/PapersBand.svelte';
  import HowItWorks from '$lib/components/HowItWorks.svelte';
  import SourcesCarousel from '$lib/components/SourcesCarousel.svelte';
  import Uploader from '$lib/components/Uploader.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>ReadNext — your next five papers</title>
</svelte:head>

<Nav />
<main>
  <Hero />
  <PapersBand />
  <HowItWorks />
  <SourcesCarousel />
  <Uploader />
</main>
<Footer />
