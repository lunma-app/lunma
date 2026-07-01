/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Entity_OtherInputs */

const en_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const es_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otros`)
};

const pt_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outro`)
};

const fr_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autre`)
};

const de_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sonstiges`)
};

const ja_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`その他`)
};

const ko_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기타`)
};

const zh_cn2_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`其他`)
};

const ru_entity_other = /** @type {(inputs: Entity_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Прочее`)
};

/**
* | output |
* | --- |
* | "Other" |
*
* @param {Entity_OtherInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_other = /** @type {((inputs?: Entity_OtherInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_OtherInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_entity_other(inputs)
	if (locale === "es") return es_entity_other(inputs)
	if (locale === "pt") return pt_entity_other(inputs)
	if (locale === "fr") return fr_entity_other(inputs)
	if (locale === "de") return de_entity_other(inputs)
	if (locale === "ja") return ja_entity_other(inputs)
	if (locale === "ko") return ko_entity_other(inputs)
	if (locale === "zh-CN") return zh_cn2_entity_other(inputs)
	return ru_entity_other(inputs)
});