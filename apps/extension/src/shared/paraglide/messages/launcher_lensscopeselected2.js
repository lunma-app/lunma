/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Launcher_Lensscopeselected2Inputs */

const en_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} selected`)
};

const es_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} seleccionados`)
};

const pt_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Selecionados: ${i?.count}`)
};

const fr_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} sélectionnés`)
};

const de_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} ausgewählt`)
};

const ja_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} 件選択中`)
};

const ko_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count}개 선택됨`)
};

const zh_cn2_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`已选 ${i?.count} 项`)
};

const ru_launcher_lensscopeselected2 = /** @type {(inputs: Launcher_Lensscopeselected2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Выбрано: ${i?.count}`)
};

/**
* | output |
* | --- |
* | "{count} selected" |
*
* @param {Launcher_Lensscopeselected2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensscopeselected2 = /** @type {((inputs: Launcher_Lensscopeselected2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensscopeselected2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensscopeselected2(inputs)
	if (locale === "es") return es_launcher_lensscopeselected2(inputs)
	if (locale === "pt") return pt_launcher_lensscopeselected2(inputs)
	if (locale === "fr") return fr_launcher_lensscopeselected2(inputs)
	if (locale === "de") return de_launcher_lensscopeselected2(inputs)
	if (locale === "ja") return ja_launcher_lensscopeselected2(inputs)
	if (locale === "ko") return ko_launcher_lensscopeselected2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensscopeselected2(inputs)
	return ru_launcher_lensscopeselected2(inputs)
});
export { launcher_lensscopeselected2 as "launcher_lensScopeSelected" }