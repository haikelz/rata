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

<div class="border-b border-base-300 px-4 sm:px-8 lg:px-12">
	<div
		class="grid max-w-md grid-cols-2"
		role="tablist"
		aria-label="Jenis transaksi"
		aria-orientation="horizontal"
	>
		{#each tabs as tab, index (tab.value)}
			<button
				id={`calculator-tab-${tab.value}`}
				class={`min-h-12 border-b-2 px-4 py-3 text-sm font-medium transition-colors motion-reduce:transition-none ${
					value === tab.value
						? 'border-primary bg-base-200 text-primary'
						: 'border-transparent text-base-content/50 hover:bg-base-200/40 hover:text-base-content'
				}`}
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
</div>
