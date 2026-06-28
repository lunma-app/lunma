/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Entity_IssuesInputs */

const en_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issues`)
};

const es_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incidencias`)
};

const pt_pt2_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problemas`)
};

const fr_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Problèmes`)
};

const de_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issues`)
};

const ja_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`課題`)
};

const ko_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이슈`)
};

const zh_cn2_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`问题`)
};

const ru_entity_issues = /** @type {(inputs: Entity_IssuesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Задачи`)
};

/**
* | output |
* | --- |
* | "Issues" |
*
* @param {Entity_IssuesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_issues = /** @type {((inputs?: Entity_IssuesInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_IssuesInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_entity_issues(inputs)
	if (locale === "es") return es_entity_issues(inputs)
	if (locale === "pt-PT") return pt_pt2_entity_issues(inputs)
	if (locale === "fr") return fr_entity_issues(inputs)
	if (locale === "de") return de_entity_issues(inputs)
	if (locale === "ja") return ja_entity_issues(inputs)
	if (locale === "ko") return ko_entity_issues(inputs)
	if (locale === "zh-CN") return zh_cn2_entity_issues(inputs)
	return ru_entity_issues(inputs)
});