/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_Tabhintcycle2Inputs */

const en_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab to cycle`)
};

const es_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para cambiar`)
};

const pt_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para alternar`)
};

const fr_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab pour cycler`)
};

const de_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab zum Wechseln`)
};

const ja_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab で切り替え`)
};

const ko_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab으로 순환`)
};

const zh_cn2_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab 键切换`)
};

const ru_launcher_overlay_tabhintcycle2 = /** @type {(inputs: Launcher_Overlay_Tabhintcycle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab для перебора`)
};

/**
* | output |
* | --- |
* | "Tab to cycle" |
*
* @param {Launcher_Overlay_Tabhintcycle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_tabhintcycle2 = /** @type {((inputs?: Launcher_Overlay_Tabhintcycle2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Tabhintcycle2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "es") return es_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "pt") return pt_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "fr") return fr_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "de") return de_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "ja") return ja_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "ko") return ko_launcher_overlay_tabhintcycle2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_tabhintcycle2(inputs)
	return ru_launcher_overlay_tabhintcycle2(inputs)
});
export { launcher_overlay_tabhintcycle2 as "launcher_overlay_tabHintCycle" }