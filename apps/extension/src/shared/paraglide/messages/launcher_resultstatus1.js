/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Launcher_Resultstatus1Inputs */

const en_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} result`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} results`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

const es_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} resultado`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} resultados`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

const pt_pt2_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("pt-PT", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} resultado`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} resultados`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

const fr_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} résultat`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} résultats`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

const de_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("de", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} Ergebnis`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} Ergebnisse`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

const ja_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ja", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count} 件`)
};

const ko_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("ko", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count}개 결과`)
};

const zh_cn2_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {
	const countPlural = registry.plural("zh-CN", i?.count, {});return /** @type {LocalizedString} */ (`${i?.count} 个结果`)
};

const ru_launcher_resultstatus1 = /** @type {(inputs: Launcher_Resultstatus1Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ru", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} результат`);
	if (countPlural === "few") return /** @type {LocalizedString} */ (`${i?.count} результата`);
	if (countPlural === "many") return /** @type {LocalizedString} */ (`${i?.count} результатов`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} результатов`);
	return /** @type {LocalizedString} */ ("launcher_resultStatus");
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} result" |
* | "other" | "{count} results" |
*
* @param {Launcher_Resultstatus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_resultstatus1 = /** @type {((inputs: Launcher_Resultstatus1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Resultstatus1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_resultstatus1(inputs)
	if (locale === "es") return es_launcher_resultstatus1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_resultstatus1(inputs)
	if (locale === "fr") return fr_launcher_resultstatus1(inputs)
	if (locale === "de") return de_launcher_resultstatus1(inputs)
	if (locale === "ja") return ja_launcher_resultstatus1(inputs)
	if (locale === "ko") return ko_launcher_resultstatus1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_resultstatus1(inputs)
	return ru_launcher_resultstatus1(inputs)
});
export { launcher_resultstatus1 as "launcher_resultStatus" }