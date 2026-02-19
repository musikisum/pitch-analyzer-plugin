import pcSet from './pc-set.js';
import setTable from './pc-set-table.js';

const template = ''
    + '<div class=\'pcSetProviderResult\'>'
    + '    <table>'
    + '        <tbody>'
    + '            <tr>'
    + '                <th class=\'label\'>Prime Form (Rahn):</th>'
    + '                <td>{{rahnPrimeForm}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Prime Form (Forte):</th>'
    + '                <td>{{fortePrimeForm}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Intervallvektor:</th>'
    + '                <td>{{intervalVector}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Name (Forte):</th>'
    + '                <td>{{forteName}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Z-Mate:</th>'
    + '                <td>{{zMate}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Obermengen:</th>'
    + '                <td>{{superSets}}</td>'
    + '            </tr>'
    + '            <tr>'
    + '                <th class=\'label\'>Untermengen:</th>'
    + '                <td>{{subSets}}</td>'
    + '            </tr>'
    + '        </tbody>'
    + '    </table>'
    + '</div>';

function formatPrimeForm(primeForm, includeForteName) {
  if (primeForm.length === 0) {
    return '(<i>empty</i>)';
  }
  const set = setTable[primeForm];
  const forteName = includeForteName && set.forteName ? `<b>${set.forteName}</b>:&nbsp;` : '';
  return `${forteName}(${primeForm.join(',&nbsp;')})`;
}

function formatIntervalVector(intervalVector) {
  return `[${intervalVector.join('')}]`;
}

function formatForteName(forteName) {
  return forteName || '&ndash;';
}

function formatZMate(zMate) {
  return zMate ? formatPrimeForm(zMate) : '&ndash;';
}

function formatSuperOrSubSets(sets) {
  if (sets.length === 0) {
    return '&ndash;';
  }
  return sets.map(set => formatPrimeForm(set, true)).join('<br>');
}

export default function PcSetProvider(noteSet) {
  const set = pcSet(noteSet);

  const data = {
    rahnPrimeForm: formatPrimeForm(set.rahnPrimeForm, false),
    fortePrimeForm: formatPrimeForm(set.fortePrimeForm, false),
    intervalVector: formatIntervalVector(set.intervalVector),
    forteName: formatForteName(set.forteName),
    zMate: formatZMate(set.zMate),
    superSets: formatSuperOrSubSets(set.superSets),
    subSets: formatSuperOrSubSets(set.subSets)
  };

  return template.replace(/{{(\w+)}}/g, (_, key) => data[key]);
}
