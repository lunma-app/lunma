<script lang="ts">
import ReviewerRail from './ReviewerRail.svelte';

type Verdict = 'approved' | 'changes' | 'pending';

interface Props {
  reviewers?: { initials: string; state?: Verdict; title?: string }[];
  max?: number;
}

const { reviewers = [{ initials: 'AB', state: 'approved' }], max }: Props = $props();
</script>

<ReviewerRail {reviewers} {max} />
