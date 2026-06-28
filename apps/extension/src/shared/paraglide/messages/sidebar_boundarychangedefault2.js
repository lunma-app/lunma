/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Boundarychangedefault2Inputs */

const en_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change the default in Settings`)
};

const es_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar el valor predeterminado en Ajustes`)
};

const pt_pt2_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alterar a predefinição nas Definições`)
};

const fr_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le réglage par défaut dans les Paramètres`)
};

const de_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard in den Einstellungen ändern`)
};

const ja_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`設定でデフォルトを変更`)
};

const ko_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설정에서 기본값 변경`)
};

const zh_cn2_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`在设置中更改默认值`)
};

const ru_sidebar_boundarychangedefault2 = /** @type {(inputs: Sidebar_Boundarychangedefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Изменить по умолчанию в настройках`)
};

/**
* | output |
* | --- |
* | "Change the default in Settings" |
*
* @param {Sidebar_Boundarychangedefault2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarychangedefault2 = /** @type {((inputs?: Sidebar_Boundarychangedefault2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarychangedefault2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_boundarychangedefault2(inputs)
	if (locale === "es") return es_sidebar_boundarychangedefault2(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_boundarychangedefault2(inputs)
	if (locale === "fr") return fr_sidebar_boundarychangedefault2(inputs)
	if (locale === "de") return de_sidebar_boundarychangedefault2(inputs)
	if (locale === "ja") return ja_sidebar_boundarychangedefault2(inputs)
	if (locale === "ko") return ko_sidebar_boundarychangedefault2(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_boundarychangedefault2(inputs)
	return ru_sidebar_boundarychangedefault2(inputs)
});
export { sidebar_boundarychangedefault2 as "sidebar_boundaryChangeDefault" }