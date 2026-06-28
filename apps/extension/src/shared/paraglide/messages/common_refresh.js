/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_RefreshInputs */

const en_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh`)
};

const es_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const pt_pt2_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atualizar`)
};

const fr_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

const de_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktualisieren`)
};

const ja_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`更新`)
};

const ko_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새로 고침`)
};

const zh_cn2_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`刷新`)
};

const ru_common_refresh = /** @type {(inputs: Common_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Обновить`)
};

/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Common_RefreshInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_refresh = /** @type {((inputs?: Common_RefreshInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_RefreshInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_refresh(inputs)
	if (locale === "es") return es_common_refresh(inputs)
	if (locale === "pt-PT") return pt_pt2_common_refresh(inputs)
	if (locale === "fr") return fr_common_refresh(inputs)
	if (locale === "de") return de_common_refresh(inputs)
	if (locale === "ja") return ja_common_refresh(inputs)
	if (locale === "ko") return ko_common_refresh(inputs)
	if (locale === "zh-CN") return zh_cn2_common_refresh(inputs)
	return ru_common_refresh(inputs)
});