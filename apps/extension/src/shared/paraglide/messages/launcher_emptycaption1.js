/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Emptycaption1Inputs */

const en_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nothing kept here yet. Open a few tabs — anything you don't pin settles out on its own.`)
};

const es_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay nada aquí. Abre algunas pestañas — lo que no fijes desaparecerá solo.`)
};

const pt_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda nada aqui. Abra alguns separadores — o que não fixar desaparece por si só.`)
};

const fr_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rien de gardé ici pour l'instant. Ouvrez quelques onglets — tout ce que vous n'épinglez pas se range seul.`)
};

const de_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch nichts hier. Öffne ein paar Tabs — was du nicht anheftest, sortiert sich von selbst.`)
};

const ja_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`まだ何も保存されていません。いくつかタブを開いてみましょう — 固定しないものは自然と整理されます。`)
};

const ko_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 저장된 항목이 없습니다. 탭을 몇 개 열어보세요 — 고정하지 않은 탭은 저절로 정리됩니다.`)
};

const zh_cn2_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂未保留任何内容。多打开几个标签页 — 未固定的会自动沉淀`)
};

const ru_launcher_emptycaption1 = /** @type {(inputs: Launcher_Emptycaption1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Здесь пока ничего нет. Открывайте вкладки — незакреплённые осядут здесь сами.`)
};

/**
* | output |
* | --- |
* | "Nothing kept here yet. Open a few tabs — anything you don't pin settles out on its own." |
*
* @param {Launcher_Emptycaption1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_emptycaption1 = /** @type {((inputs?: Launcher_Emptycaption1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Emptycaption1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_emptycaption1(inputs)
	if (locale === "es") return es_launcher_emptycaption1(inputs)
	if (locale === "pt") return pt_launcher_emptycaption1(inputs)
	if (locale === "fr") return fr_launcher_emptycaption1(inputs)
	if (locale === "de") return de_launcher_emptycaption1(inputs)
	if (locale === "ja") return ja_launcher_emptycaption1(inputs)
	if (locale === "ko") return ko_launcher_emptycaption1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_emptycaption1(inputs)
	return ru_launcher_emptycaption1(inputs)
});
export { launcher_emptycaption1 as "launcher_emptyCaption" }