/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Connectionsdescription1Inputs */

const en_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect a service once, then reuse it in any lens. GitLab and Jira ride your browser's sign-in by default; GitHub needs a token. RSS feeds are public URLs — no auth.`)
};

const es_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conecta un servicio una vez y úsalo en cualquier lente. GitLab y Jira usan tu sesión del navegador; GitHub necesita un token. Los feeds RSS son URLs públicas — sin autenticación.`)
};

const pt_pt2_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ligue um serviço uma vez e reutilize-o em qualquer lens. GitLab e Jira usam o início de sessão do browser por padrão; GitHub precisa de token. Feeds RSS são URLs públicos — sem autenticação.`)
};

const fr_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez un service une fois, puis réutilisez-le dans n'importe quelle vue. GitLab et Jira utilisent votre connexion navigateur par défaut ; GitHub nécessite un token. Les flux RSS sont des URL publics — aucune authentification.`)
};

const de_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbinde einen Dienst einmal und nutze ihn in beliebigen Lenses. GitLab und Jira nutzen standardmäßig deine Browser-Anmeldung; GitHub benötigt einen Token. RSS-Feeds sind öffentliche URLs — keine Authentifizierung nötig.`)
};

const ja_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`サービスを一度接続すると、どのレンズでも再利用できます。GitLab と Jira はデフォルトでブラウザのサインインを使用し、GitHub にはトークンが必要です。RSS フィードはパブリック URL — 認証不要。`)
};

const ko_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`서비스를 한 번 연결하면 모든 렌즈에서 재사용할 수 있습니다. GitLab과 Jira는 기본적으로 브라우저 로그인을 사용하고, GitHub는 토큰이 필요합니다. RSS 피드는 공개 URL로 인증이 필요 없습니다.`)
};

const zh_cn2_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`连接一次服务，即可在任意镜头中复用。GitLab 和 Jira 默认使用浏览器登录；GitHub 需要令牌。RSS 订阅源为公开 URL，无需认证`)
};

const ru_options_connectionsdescription1 = /** @type {(inputs: Options_Connectionsdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Подключите сервис один раз и используйте в любой линзе. GitLab и Jira используют вход через браузер; GitHub требует токен. RSS-ленты — публичные URL, авторизация не нужна.`)
};

/**
* | output |
* | --- |
* | "Connect a service once, then reuse it in any lens. GitLab and Jira ride your browser's sign-in by default; GitHub needs a token. RSS feeds are public URLs — ..." |
*
* @param {Options_Connectionsdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connectionsdescription1 = /** @type {((inputs?: Options_Connectionsdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connectionsdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_connectionsdescription1(inputs)
	if (locale === "es") return es_options_connectionsdescription1(inputs)
	if (locale === "pt-PT") return pt_pt2_options_connectionsdescription1(inputs)
	if (locale === "fr") return fr_options_connectionsdescription1(inputs)
	if (locale === "de") return de_options_connectionsdescription1(inputs)
	if (locale === "ja") return ja_options_connectionsdescription1(inputs)
	if (locale === "ko") return ko_options_connectionsdescription1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_connectionsdescription1(inputs)
	return ru_options_connectionsdescription1(inputs)
});
export { options_connectionsdescription1 as "options_connectionsDescription" }