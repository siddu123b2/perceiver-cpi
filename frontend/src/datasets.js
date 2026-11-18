/** Plain-language guidance on the three models, so a user can tell which one to pick.
 *
 * The accuracy numbers are NOT here - those come live from GET /models, so the page can never
 * disagree with the model registry. This file holds only the things a person needs to understand
 * the choice: what was measured, what the scale means, and when each one is the right pick.
 */
export const DATASET_GUIDE = {
  davis: {
    title: 'Davis',
    measures: 'Kd — the concentration at which half the protein is bound',
    scaleNote: 'pKd. 7 means 100 nM, 8 means 10 nM. Each whole number is a 10× stronger bind.',
    size: '68 compounds × 379 kinases',
    pick: 'The most established kinase benchmark. Best choice for a kinase inhibitor against a kinase target.',
    watch: 'About 70% of its labels sit at exactly 5.0, which is the dataset\'s way of recording "no binding detected". The model therefore sees far more non-binders than binders.',
  },
  kiba: {
    title: 'KIBA',
    measures: 'A composite score blending Kd, Ki and IC50 measurements',
    scaleNote: 'KIBA score. Higher is stronger. 12.1 is the threshold used in the literature to call something a binder.',
    size: '2,068 compounds × 229 kinases',
    pick: 'The widest chemical coverage of the three. Best when your compound is unusual or far from typical inhibitor chemistry.',
    watch: 'This is our weakest model: on new compound–protein pairs it does not beat simply predicting the dataset average. Treat its numbers as a rough signal only.',
  },
  metz: {
    title: 'Metz',
    measures: 'Ki — how tightly the compound binds, from inhibition assays',
    scaleNote: 'pKi. Same shape as pKd: 7 means 100 nM, and each whole number is 10× stronger.',
    size: '1,423 compounds × 170 kinases',
    pick: 'Trained on evenly spread inhibition constants, so its predictions vary most across targets.',
    watch: 'Smallest protein set of the three, so an unusual target is more likely to fall outside what it has seen.',
  },
}

/** Two real compound–protein pairs from the Davis test set, for the "try an example" buttons.
 *  Both are pairs the model was never trained on. */
export const EXAMPLES = [
  {
    name: 'Vemurafenib + a kinase domain',
    short: 'Example A',
    smiles: 'CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2c[nH]c3ncc(Cl)cc23)c1F',
    sequence:
      'LKMNKLPSNRGNTLREVQLMNRLRHPNILRFMGVCVHQGQLHALTEYMNGGTLEXLLSSPEPLSWPVRLHLALDIARGLRYLHSKG' +
      'VFHRDLTSKNCLVRREDRGFTAVVGDFGLAEKIPVYREGARKEPLAVVGSPYWMAPEVLRGELYDEKADVFAFGIVLCELIARVPA' +
      'DPDYLPRTEDFGLDVPAFRTLVGDDCPLPFLLLAIHCCNLEPSTRAPFTEITQHLEWILEQLPEPAPLTXTA',
  },
  {
    name: 'Erlotinib + EGFR-family kinase',
    short: 'Example B',
    smiles: 'C#Cc1cccc(Nc2ncnc3cc(OCCOC)c(OCCOC)cc23)c1',
    sequence:
      'MGCIKSKENKSPAIKYRPENTPEPVSTSVSHYGAEPTTVSPCPSSSAKGTAVNFSSLSMTPFGGSSGVTPFGGASSSFSVVPSSYP' +
      'AGLTGGVTIFVALYDYEARTEDDLSFHKGEKFQILNSSEGDWWEARSLTTGETGYIPSNYVAPVDSIQAEEWYFGKITRRESERLL' +
      'LNPENPRGTFLVRESETTKGAYCLSVSDFDNAKGLNVKHYKIRKLDSGGFYITSRTQFSSLQQLVAYYSKHADGLCHRLTNV',
  },
]
