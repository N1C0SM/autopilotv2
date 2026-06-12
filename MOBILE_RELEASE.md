# Publicación de Autopilot en App Store y Play Store

Guía mínima para generar el binario nativo y subirlo a las tiendas.
Todo lo que está dentro de este repo ya está configurado: solo necesitas
ejecutar los comandos en tu máquina cuando tengas las cuentas listas.

## Datos de la app

- **Nombre:** Autopilot
- **Bundle ID / Application ID:** `app.lovable.aa0029da00154c05a2b503e61df0f87c`
- **Política de privacidad (URL pública obligatoria):** https://autopilotplan.com/legal
- **Web oficial:** https://autopilotplan.com

## Requisitos previos (una sola vez)

- Cuenta de **Apple Developer Program** (99 USD/año) — necesaria para iOS.
- Cuenta de **Google Play Console** (25 USD pago único) — necesaria para Android.
- **Mac con Xcode** (última versión) para compilar iOS.
- **Android Studio** para compilar Android.
- Node 20+ y `npm` instalados.

## 1. Preparar el proyecto en local

```bash
git pull
npm install
npx cap add ios       # solo la primera vez
npx cap add android   # solo la primera vez
```

## 2. Build de producción + sync nativo

```bash
npm run build              # genera /dist
npm run assets:generate    # genera iconos y splash para iOS/Android desde resources/
npx cap sync               # copia /dist y plugins a los proyectos nativos
```

> Importante: `capacitor.config.ts` ya está preparado para producción.
> Si en algún momento quieres volver al hot-reload contra Lovable
> (solo en desarrollo, nunca para subir a la tienda), usa:
> `CAP_DEV=1 npx cap sync`

## 3. iOS — subir a App Store Connect

```bash
npx cap open ios
```

En Xcode:
1. Selecciona el target **App** → pestaña **Signing & Capabilities**.
2. Marca **Automatically manage signing** y elige tu **Team** de Apple Developer.
3. Verifica que **Bundle Identifier** = `app.lovable.aa0029da00154c05a2b503e61df0f87c`.
4. Sube la **Version** (ej: `1.0.0`) y el **Build** (ej: `1`).
5. Selecciona destino **Any iOS Device (arm64)**.
6. Menú **Product → Archive**.
7. En el Organizer, **Distribute App → App Store Connect → Upload**.

Luego, en https://appstoreconnect.apple.com crea la ficha, sube capturas
(6.7", 6.5" y 5.5") y envía a revisión.

## 4. Android — subir a Play Console

### Generar keystore (una sola vez, guárdalo a salvo)

```bash
keytool -genkey -v -keystore autopilot-release.keystore \
  -alias autopilot -keyalg RSA -keysize 2048 -validity 10000
```

Guarda contraseña + alias + keystore en un sitio seguro (sin esto no
podrás volver a publicar actualizaciones).

### Configurar la firma en `android/`

Crea `android/keystore.properties` (NO lo subas a git):

```
storeFile=../../autopilot-release.keystore
storePassword=TU_PASSWORD
keyAlias=autopilot
keyPassword=TU_PASSWORD
```

Y en `android/app/build.gradle` añade dentro de `android { ... }`:

```gradle
signingConfigs {
    release {
        def props = new Properties()
        props.load(new FileInputStream(rootProject.file("keystore.properties")))
        storeFile file(props['storeFile'])
        storePassword props['storePassword']
        keyAlias props['keyAlias']
        keyPassword props['keyPassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Generar el AAB

```bash
cd android
./gradlew bundleRelease
```

El bundle queda en `android/app/build/outputs/bundle/release/app-release.aab`.
Súbelo en https://play.google.com/console.

## 5. Material que pedirán las tiendas

- **Icono 1024×1024** → ya está en `resources/icon.png`.
- **Capturas de pantalla** (mínimo 2-3) en distintos tamaños.
  - iOS: 6.7", 6.5", 5.5".
  - Android: teléfono + tablet 7" + tablet 10".
- **Feature graphic** Play Store: 1024×500 PNG/JPG.
- **Descripción corta** (≤80 caracteres) y **descripción larga** (≤4000).
- **Categoría:** Salud y forma física / Health & Fitness.
- **Clasificación por edades:** completar cuestionario en cada consola.
- **Política de privacidad:** https://autopilotplan.com/legal

## 6. Actualizar la app más adelante

Cada nueva versión:

```bash
git pull
npm install
npm run build
npx cap sync
```

- iOS: sube `Version` y `Build` en Xcode → Archive → Upload.
- Android: sube `versionCode` y `versionName` en `android/app/build.gradle`
  → `./gradlew bundleRelease` → subir AAB.

## 7. Regenerar icono / splash

Si cambias `resources/icon.png` o `resources/splash.png`:

```bash
npm run assets:generate
npx cap sync
```