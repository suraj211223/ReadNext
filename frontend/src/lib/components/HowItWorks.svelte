<script>
  import Card from './Card.svelte';
  import { reveal } from '$lib/actions';
  import { pipeline } from '$lib/sampleData';
</script>

<section id="how" class="band">
  <div class="container">
   
    <h2 class="section-h2" use:reveal>How it works</h2>

    <div class="steps">
      {#each pipeline as step, i}
        <div class="step-wrap reveal-item" use:reveal={{ delay: i * 70 }}>
          <Card>
            <span class="num mono">{step.n}</span>
            <h3 class="step-title">{step.title}</h3>
            <p class="step-body">{step.body}</p>
          </Card>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>

   .section-h2{
     padding-bottom:12px;
   }

  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  .num {
    display: inline-block;
    background: var(--accent);
    color: var(--accent-ink);
    border: 2px solid var(--accent-ink);
    border-radius: var(--radius);
    padding: 0.15rem 0.5rem;
    margin-bottom: 0.75rem;
  }
  .step-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  .step-body {
    color: var(--text-muted);
    font-size: 0.97rem;
    margin: 0;
  }
</style>
