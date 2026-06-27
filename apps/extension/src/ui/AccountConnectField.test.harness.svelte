<script lang="ts">
import AccountConnectField from './AccountConnectField.svelte';

interface Props {
  host?: string;
  requirement?: 'required' | 'optional';
  hasToken?: boolean;
  onConnect?: (token: string) => void;
  onReplace?: () => void;
  onCancel?: () => void;
  error?: string;
  helpUrl?: string;
}

const {
  host = 'github.com',
  requirement = 'required',
  hasToken = false,
  onConnect = () => undefined,
  onReplace,
  onCancel,
  error,
  helpUrl,
}: Props = $props();
</script>

<AccountConnectField
  {host}
  {requirement}
  {hasToken}
  {onConnect}
  {onReplace}
  {onCancel}
  {error}
  {helpUrl}
/>
