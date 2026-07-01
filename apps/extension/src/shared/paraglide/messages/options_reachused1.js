/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Options_Reachused1Inputs */

const en_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Used in ${i?.count} lens`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Used in ${i?.count} lenses`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

const es_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Usado en ${i?.count} lente`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Usado en ${i?.count} lentes`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

const pt_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("pt", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Usado em ${i?.count} lens`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Usado em ${i?.count} lenses`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

const fr_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Utilisé dans ${i?.count} vue`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Utilisé dans ${i?.count} vues`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

const de_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("de", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`In ${i?.count} Lens verwendet`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`In ${i?.count} Lenses verwendet`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

const ja_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ja", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count} 個のレンズで使用中`)
};

const ko_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ko", i?.count, {});return /** @type {LocalizedString} */ (`렌즈 ${i?.count}개에서 사용 중`)
};

const zh_cn2_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("zh-CN", i?.count, {});return /** @type {LocalizedString} */ (`已用于 ${i?.count} 个镜头`)
};

const ru_options_reachused1 = /** @type {(inputs: Options_Reachused1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ru", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`Используется в ${i?.count} линзе`);
	if (countPlural === "few") return /** @type {LocalizedString} */ (`Используется в ${i?.count} линзах`);
	if (countPlural === "many") return /** @type {LocalizedString} */ (`Используется в ${i?.count} линзах`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`Используется в ${i?.count} линзах`);
	return /** @type {LocalizedString} */ ("options_reachUsed");
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Used in {count} lens" |
* | "other" | "Used in {count} lenses" |
*
* @param {Options_Reachused1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_reachused1 = /** @type {((inputs: Options_Reachused1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Reachused1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_reachused1(inputs)
	if (locale === "es") return es_options_reachused1(inputs)
	if (locale === "pt") return pt_options_reachused1(inputs)
	if (locale === "fr") return fr_options_reachused1(inputs)
	if (locale === "de") return de_options_reachused1(inputs)
	if (locale === "ja") return ja_options_reachused1(inputs)
	if (locale === "ko") return ko_options_reachused1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_reachused1(inputs)
	return ru_options_reachused1(inputs)
});
export { options_reachused1 as "options_reachUsed" }