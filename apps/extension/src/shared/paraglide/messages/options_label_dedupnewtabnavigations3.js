/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Label_Dedupnewtabnavigations3Inputs */

const en_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch to an already-open tab`)
};

const es_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar a una pestaña ya abierta`)
};

const pt_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mudar para separador já aberto`)
};

const fr_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basculer vers un onglet déjà ouvert`)
};

const de_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zu bereits geöffnetem Tab wechseln`)
};

const ja_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`既に開いているタブに切り替え`)
};

const ko_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 열린 탭으로 전환`)
};

const zh_cn2_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`切换到已打开的标签页`)
};

const ru_options_label_dedupnewtabnavigations3 = /** @type {(inputs: Options_Label_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Переключиться на уже открытую вкладку`)
};

/**
* | output |
* | --- |
* | "Switch to an already-open tab" |
*
* @param {Options_Label_Dedupnewtabnavigations3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_dedupnewtabnavigations3 = /** @type {((inputs?: Options_Label_Dedupnewtabnavigations3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Dedupnewtabnavigations3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "es") return es_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "pt") return pt_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "fr") return fr_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "de") return de_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "ja") return ja_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "ko") return ko_options_label_dedupnewtabnavigations3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_label_dedupnewtabnavigations3(inputs)
	return ru_options_label_dedupnewtabnavigations3(inputs)
});
export { options_label_dedupnewtabnavigations3 as "options_label_dedupNewTabNavigations" }