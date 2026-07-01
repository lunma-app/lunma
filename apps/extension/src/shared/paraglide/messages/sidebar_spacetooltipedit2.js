/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spacetooltipedit2Inputs */

const en_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · click to edit`)
};

const es_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · clic para editar`)
};

const pt_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · clique para editar`)
};

const fr_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · cliquez pour modifier`)
};

const de_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · zum Bearbeiten klicken`)
};

const ja_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · クリックして編集`)
};

const ko_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · 클릭하여 편집`)
};

const zh_cn2_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · 点击编辑`)
};

const ru_sidebar_spacetooltipedit2 = /** @type {(inputs: Sidebar_Spacetooltipedit2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.name} · нажмите для редактирования`)
};

/**
* | output |
* | --- |
* | "{name} · click to edit" |
*
* @param {Sidebar_Spacetooltipedit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacetooltipedit2 = /** @type {((inputs: Sidebar_Spacetooltipedit2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacetooltipedit2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_spacetooltipedit2(inputs)
	if (locale === "es") return es_sidebar_spacetooltipedit2(inputs)
	if (locale === "pt") return pt_sidebar_spacetooltipedit2(inputs)
	if (locale === "fr") return fr_sidebar_spacetooltipedit2(inputs)
	if (locale === "de") return de_sidebar_spacetooltipedit2(inputs)
	if (locale === "ja") return ja_sidebar_spacetooltipedit2(inputs)
	if (locale === "ko") return ko_sidebar_spacetooltipedit2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_spacetooltipedit2(inputs)
	return ru_sidebar_spacetooltipedit2(inputs)
});
export { sidebar_spacetooltipedit2 as "sidebar_spaceTooltipEdit" }