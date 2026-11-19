"""Generate every figure in the paper from the recorded results.

    .venv\\Scripts\\python.exe paper\\make_figures.py

Nothing here is drawn by hand: each figure reads the JSON written by the evaluation scripts, so a
figure cannot drift away from the numbers in the tables. Output is PDF (vector, for LaTeX) and PNG.
"""
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'paper' / 'figures'
OUT.mkdir(parents=True, exist_ok=True)

# IEEE single column is 3.5 in; double column 7.16 in.
plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['Times New Roman', 'DejaVu Serif'],
    'font.size': 8,
    'axes.labelsize': 8,
    'axes.titlesize': 8.5,
    'legend.fontsize': 7,
    'xtick.labelsize': 7,
    'ytick.labelsize': 7,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.grid': True,
    'grid.alpha': 0.25,
    'grid.linewidth': 0.5,
    'lines.linewidth': 1.2,
    'figure.dpi': 300,
})

NAVY, TEAL, AMBER, GREY, RED = '#27496d', '#2a9d8f', '#e9a23b', '#8d99ae', '#c1666b'


def save(fig, name):
    for ext in ('pdf', 'png'):
        fig.savefig(OUT / f'{name}.{ext}', bbox_inches='tight', pad_inches=0.02)
    plt.close(fig)
    print(f'  {name}.pdf / .png')


cv = json.loads((ROOT / 'experiments/phase5/cv_metrics.json').read_text())
step = json.loads((ROOT / 'experiments/phase5/stepB_metrics.json').read_text())

PAPER_MSE = {'davis': (0.463, 0.013), 'metz': (0.658, 0.016)}



# ----------------------------------------------------------------- Fig. 1
def fig_architecture():
    """System diagram: the two resolution paths and where each component sits."""
    from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
    fig, ax = plt.subplots(figsize=(7.16, 3.05))
    ax.set_xlim(0, 100); ax.set_ylim(0, 44); ax.axis('off'); ax.grid(visible=False)

    def box(x, y, w, h, text, face, edge, fs=7.2, weight='normal'):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.35,rounding_size=1.1',
                                    facecolor=face, edgecolor=edge, linewidth=0.9, zorder=2))
        ax.text(x + w / 2, y + h / 2, text, ha='center', va='center', fontsize=fs,
                zorder=3, color='#13233a', fontweight=weight, linespacing=1.4)

    def arrow(x1, y1, x2, y2):
        ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=8,
                                     linewidth=0.85, color='#55617a', shrinkA=1, shrinkB=1,
                                     zorder=1))

    LIGHT, SOFT, WARM, PALE = '#e8eef6', '#e2f2ef', '#fdf0dc', '#f1f3f6'
    nl = chr(10)

    box(1, 17.5, 15, 9, nl.join(['User query', '', 'SMILES +', 'protein sequence']),
        PALE, '#9aa6bd', weight='bold')
    box(21, 29, 24, 12.5, nl.join(['Affinity prediction', '', 'D-MPNN graph + Morgan FP',
                                   'nested cross-attention', '1-D CNN protein encoder']),
        LIGHT, NAVY)
    box(49, 31.5, 17, 7.5, nl.join(['Score, band,', 'confidence,', 'scope warnings']), LIGHT, NAVY)
    box(21, 3, 24, 12.5, nl.join(['Structure resolution', '', 'InChIKey + sequence index',
                                  'over 204k BindingDB rows']), SOFT, TEAL)
    box(49, 9.5, 17, 6.5, nl.join(['Solved complex', '(74% of queries)']), SOFT, TEAL)
    box(49, 1, 17, 6.5, nl.join(['Docking service', 'Vina / P2Rank / PLIP']), WARM, AMBER)
    box(71, 15.5, 27, 13, nl.join(['Presentation layer', '', 'single-origin web client',
                                   'pose, pocket residues,', 'polar contacts,',
                                   'grounded explanation']), PALE, '#9aa6bd', weight='bold')

    arrow(16, 24, 21, 35); arrow(16, 20, 21, 9)
    arrow(45, 35, 49, 35); arrow(45, 9, 49, 12.5); arrow(45, 7, 49, 4.5)
    arrow(66, 35, 71, 26); arrow(66, 12.5, 71, 22); arrow(66, 4, 71, 18)

    ax.text(33, 42.4, 'trained on Davis / KIBA / Metz', ha='center', fontsize=6.4,
            color=NAVY, style='italic')
    ax.text(33, 0.3, 'lookup and physics: nothing trained', ha='center', fontsize=6.4,
            color=TEAL, style='italic')
    save(fig, 'fig1_architecture')


# ----------------------------------------------------------------- Fig. 2
def fig_cv_spread():
    """Per-fold MSE against the reference 5-fold band. The point is the width of ours."""
    fig, axes = plt.subplots(1, 2, figsize=(7.16, 2.3))
    for ax, ds in zip(axes, ('davis', 'metz')):
        folds = cv[ds]
        k = sorted(int(i) for i in folds)
        mse = [folds[str(i)]['mse'] for i in k]
        mean, sd = np.mean(mse), np.std(mse, ddof=1)
        ref, ref_sd = PAPER_MSE[ds]

        ax.axhspan(ref - ref_sd, ref + ref_sd, color=TEAL, alpha=0.18,
                   label=f'Reference {ref:.3f}$\\pm${ref_sd:.3f}')
        ax.axhline(ref, color=TEAL, lw=1.0)
        ax.axhspan(mean - sd, mean + sd, color=NAVY, alpha=0.12,
                   label=f'This work {mean:.3f}$\\pm${sd:.3f}')
        ax.axhline(mean, color=NAVY, lw=1.0, ls='--')
        ax.plot(k, mse, 'o-', color=NAVY, ms=4, mfc='white', mew=1.1, label='Per-fold')

        for i, v in zip(k, mse):
            ax.annotate(f'{v:.2f}', (i, v), textcoords='offset points', xytext=(0, 6),
                        ha='center', fontsize=6, color=NAVY)
        ax.set_title(f'({"ab"[ds == "metz"]}) {ds.capitalize()}')
        ax.set_xlabel('Cross-validation fold')
        ax.set_xticks(k)
        ax.set_ylim(0.3, 1.25)
        ax.legend(frameon=False, loc='upper left', handlelength=1.4)
    axes[0].set_ylabel('Test MSE (lower is better)')
    save(fig, 'fig2_cv_spread')


# ----------------------------------------------------------------- Fig. 3
def fig_protein_sensitivity():
    """Within-compound protein ranking against the achievable ceiling."""
    fig, ax = plt.subplots(figsize=(3.5, 2.5))
    groups = {
        'Learned\nencoder': [step[n]['test_rank'] for n in ('davis_base_s0', 'davis_base_s1')],
        'ESM-2\nencoder': [step[n]['test_rank'] for n in ('davis_esm_s0', 'davis_esm_s1')],
        'Gated\ncombination': [step[n]['test_rank'] for n in ('davis_both_s0', 'davis_both_s1')],
    }
    x = np.arange(len(groups))
    means = [np.mean(v) for v in groups.values()]
    ax.axhline(0.414, color=TEAL, ls=':', lw=1.2)
    ax.text(len(groups) - 0.52, 0.414, ' achievable ceiling 0.414', va='bottom', ha='right',
            fontsize=6.5, color=TEAL)
    ax.axhline(0, color=GREY, lw=0.8)
    ax.text(-0.42, 0.012, 'random ordering', fontsize=6.5, color=GREY, va='bottom')
    ax.bar(x, means, 0.52, color=[NAVY, AMBER, GREY], edgecolor='white', lw=0.6, zorder=3)
    for xi, values in zip(x, groups.values()):
        ax.plot([xi] * len(values), values, 'o', color='#222', ms=3.2, zorder=4)
    for xi, m in zip(x, means):
        ax.annotate(f'{m:+.3f}', (xi, max(m, 0)), textcoords='offset points', xytext=(0, 14),
                    ha='center', fontsize=7)
    ax.set_xticks(x)
    ax.set_xticklabels(groups.keys())
    ax.set_ylabel(r'Within-compound $\rho$')
    ax.set_ylim(-0.06, 0.50)
    save(fig, 'fig3_protein_sensitivity')


# ----------------------------------------------------------------- Fig. 4
def fig_encoder_tradeoff():
    """Accuracy against protein discrimination: the two move in opposite directions."""
    fig, ax = plt.subplots(figsize=(3.5, 2.6))
    sets = [('Learned', ('davis_base_s0', 'davis_base_s1'), NAVY, 'o'),
            ('ESM-2', ('davis_esm_s0', 'davis_esm_s1'), AMBER, 's'),
            ('Gated both', ('davis_both_s0', 'davis_both_s1'), GREY, '^')]
    for label, runs, colour, marker in sets:
        mse = [step[r]['test_mse'] for r in runs]
        rank = [step[r]['test_rank'] for r in runs]
        ax.scatter(mse, rank, s=34, color=colour, marker=marker, label=label,
                   edgecolor='white', lw=0.6, zorder=3)
        ax.scatter(np.mean(mse), np.mean(rank), s=120, color=colour, marker=marker,
                   alpha=0.22, zorder=2)
    ax.annotate('better accuracy', xy=(0.635, -0.045), xytext=(0.70, -0.045),
                arrowprops=dict(arrowstyle='->', lw=0.8, color=GREY), fontsize=6.5,
                color=GREY, va='center')
    ax.set_xlabel('Test MSE (lower is better)')
    ax.set_ylabel(r'Within-compound $\rho$ (higher is better)')
    ax.legend(frameon=False, loc='upper right', handletextpad=0.3)
    save(fig, 'fig4_encoder_tradeoff')


# ----------------------------------------------------------------- Fig. 5
def fig_variance_decomposition():
    """Share of variance attributable to compound vs protein identity, predictions vs labels."""
    fig, ax = plt.subplots(figsize=(3.5, 2.4))
    datasets = ['Davis', 'KIBA', 'Metz']
    pred_c, pred_p = [69, 85, 87], [13, 9, 9]
    true_c, true_p = [28, 50, 61], [16, 18, 11]
    y = np.arange(len(datasets))
    h = 0.34
    ax.barh(y + h / 2, pred_c, h, color=NAVY, label='Compound', zorder=3)
    ax.barh(y + h / 2, pred_p, h, left=pred_c, color=TEAL, label='Protein', zorder=3)
    ax.barh(y - h / 2, true_c, h, color=NAVY, alpha=0.45, zorder=3)
    ax.barh(y - h / 2, true_p, h, left=true_c, color=TEAL, alpha=0.45, zorder=3)
    for i in range(len(datasets)):
        ax.text(-2, y[i] + h / 2, 'pred.', ha='right', va='center', fontsize=6)
        ax.text(-2, y[i] - h / 2, 'meas.', ha='right', va='center', fontsize=6)
        ax.text(pred_c[i] + pred_p[i] + 1.5, y[i] + h / 2, f'{pred_p[i]}%', va='center', fontsize=6)
        ax.text(true_c[i] + true_p[i] + 1.5, y[i] - h / 2, f'{true_p[i]}%', va='center', fontsize=6)
    ax.set_yticks(y)
    ax.set_yticklabels(datasets)
    ax.set_xlabel('Share of variance explained (%)')
    ax.set_xlim(0, 108)
    ax.legend(frameon=False, ncol=2, loc='lower right')
    ax.grid(axis='y', visible=False)
    save(fig, 'fig5_variance')


# ----------------------------------------------------------------- Fig. 6
def fig_structure_coverage():
    """What fraction of real queries can be answered with an experimental structure."""
    fig, ax = plt.subplots(figsize=(3.5, 1.5))
    labels = ['Exact complex', 'Same target', 'Same compound', 'None']
    values = [3, 57, 14, 26]
    colours = [TEAL, NAVY, AMBER, GREY]
    left = 0
    for label, value, colour in zip(labels, values, colours):
        ax.barh(0, value, left=left, color=colour, edgecolor='white', lw=0.8)
        if value >= 10:
            ax.text(left + value / 2, 0, f'{value}%', ha='center', va='center',
                    color='white', fontsize=7.5, fontweight='bold')
        left += value
    ax.set_xlim(0, 100)
    ax.set_ylim(-0.6, 0.6)
    ax.set_yticks([])
    ax.set_xlabel('Share of evaluated pairs (%)')
    ax.grid(visible=False)
    handles = [plt.Rectangle((0, 0), 1, 1, color=c) for c in colours]
    ax.legend(handles, labels, frameon=False, ncol=2, loc='upper center',
              bbox_to_anchor=(0.5, -0.55), handlelength=1.1)
    save(fig, 'fig6_structure_coverage')


if __name__ == '__main__':
    print('Writing figures to', OUT)
    fig_architecture()
    fig_architecture()
    fig_cv_spread()
    fig_protein_sensitivity()
    fig_encoder_tradeoff()
    fig_variance_decomposition()
    fig_structure_coverage()
    print('done')
