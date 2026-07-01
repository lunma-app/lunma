/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Entity_ArticlesInputs */

const en_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Articles`)
};

const es_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Artículos`)
};

const pt_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Artigos`)
};

const fr_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Articles`)
};

const de_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Artikel`)
};

const ja_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`記事`)
};

const ko_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기사`)
};

const zh_cn2_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`文章`)
};

const ru_entity_articles = /** @type {(inputs: Entity_ArticlesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Статьи`)
};

/**
* | output |
* | --- |
* | "Articles" |
*
* @param {Entity_ArticlesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_articles = /** @type {((inputs?: Entity_ArticlesInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_ArticlesInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_entity_articles(inputs)
	if (locale === "es") return es_entity_articles(inputs)
	if (locale === "pt") return pt_entity_articles(inputs)
	if (locale === "fr") return fr_entity_articles(inputs)
	if (locale === "de") return de_entity_articles(inputs)
	if (locale === "ja") return ja_entity_articles(inputs)
	if (locale === "ko") return ko_entity_articles(inputs)
	if (locale === "zh-CN") return zh_cn2_entity_articles(inputs)
	return ru_entity_articles(inputs)
});