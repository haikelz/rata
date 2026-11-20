<script module lang="ts">
	export type CalculatorMode = 'buy' | 'sell';
</script>

<script lang="ts">
	let { value = $bindable() }: { value: CalculatorMode } = $props();

	const tabs: ReadonlyArray<{ value: CalculatorMode; label: string }> = [
		{ value: 'buy', label: 'Beli saham' },
		{ value: 'sell', label: 'Jual saham' }
	];

	function selectTab(mode: CalculatorMode): void {
		value = mode;
	}

	function handleKeydown(event: KeyboardEvent, index: number): void {
		let nextIndex: number | undefined;

		switch (event.key) {
			case 'ArrowLeft':
				nextIndex = (index - 1 + tabs.length) % tabs.length;
				break;
			case 'ArrowRight':
				nextIndex = (index + 1) % tabs.length;
				break;
			case 'Home':
				nextIndex = 0;
				break;
			case 'End':
				nextIndex = tabs.length - 1;
				break;
			default:
				return;
		}

		event.preventDefault();
		const nextMode = tabs[nextIndex].value;
		selectTab(nextMode);

		requestAnimationFrame(() => {
			const nextTab = document.getElementById(`calculator-tab-${nextMode}`);
			if (nextTab instanceof HTMLButtonElement) {
				nextTab.focus();
			}
		});
	}
</script>

<div
	class="flex self-stretch"
	role="tablist"
	aria-label="Jenis transaksi"
	aria-orientation="horizontal"
>
	{#each tabs as tab, index (tab.value)}
		<button
			id={`calculator-tab-${tab.value}`}
			class={[
				'-mb-px border-r border-b-2 border-r-base-300 px-3 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none sm:px-6',
				value === tab.value
					? 'border-b-primary text-base-content'
					: 'border-b-transparent text-base-content/60 hover:bg-base-200 hover:text-base-content'
			]}
			type="button"
			role="tab"
			aria-selected={value === tab.value}
			aria-controls="calculator-panel"
			tabindex={value === tab.value ? 0 : -1}
			onclick={() => selectTab(tab.value)}
			onkeydown={(event) => handleKeydown(event, index)}
		>
			{tab.label}
		</button>
	{/each}
</div>
