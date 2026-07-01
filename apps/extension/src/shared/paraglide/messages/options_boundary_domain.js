/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Boundary_DomainInputs */

const en_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lock to domain`)
};

const es_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anclar al dominio`)
};

const pt_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bloquear ao domínio`)
};

const fr_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verrouiller au domaine`)
};

const de_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An Domain binden`)
};

const ja_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ドメインにロック`)
};

const ko_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`도메인 잠금`)
};

const zh_cn2_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`锁定到域`)
};

const ru_options_boundary_domain = /** @type {(inputs: Options_Boundary_DomainInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Привязать к домену`)
};

/**
* | output |
* | --- |
* | "Lock to domain" |
*
* @param {Options_Boundary_DomainInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_boundary_domain = /** @type {((inputs?: Options_Boundary_DomainInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Boundary_DomainInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_boundary_domain(inputs)
	if (locale === "es") return es_options_boundary_domain(inputs)
	if (locale === "pt") return pt_options_boundary_domain(inputs)
	if (locale === "fr") return fr_options_boundary_domain(inputs)
	if (locale === "de") return de_options_boundary_domain(inputs)
	if (locale === "ja") return ja_options_boundary_domain(inputs)
	if (locale === "ko") return ko_options_boundary_domain(inputs)
	if (locale === "zh-CN") return zh_cn2_options_boundary_domain(inputs)
	return ru_options_boundary_domain(inputs)
});