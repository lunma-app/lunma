/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Entity_ChangesInputs */

const en_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changes`)
};

const es_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambios`)
};

const pt_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alterações`)
};

const fr_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifications`)
};

const de_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Änderungen`)
};

const ja_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`変更`)
};

const ko_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`변경 사항`)
};

const zh_cn2_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`变更`)
};

const ru_entity_changes = /** @type {(inputs: Entity_ChangesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Изменения`)
};

/**
* | output |
* | --- |
* | "Changes" |
*
* @param {Entity_ChangesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_changes = /** @type {((inputs?: Entity_ChangesInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_ChangesInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_entity_changes(inputs)
	if (locale === "es") return es_entity_changes(inputs)
	if (locale === "pt") return pt_entity_changes(inputs)
	if (locale === "fr") return fr_entity_changes(inputs)
	if (locale === "de") return de_entity_changes(inputs)
	if (locale === "ja") return ja_entity_changes(inputs)
	if (locale === "ko") return ko_entity_changes(inputs)
	if (locale === "zh-CN") return zh_cn2_entity_changes(inputs)
	return ru_entity_changes(inputs)
});