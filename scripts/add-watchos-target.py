#!/usr/bin/env python3
"""Add the TicTacDohWatch and TicTacDohWatchTests targets to App.xcodeproj.

Idempotent. Re-run if `cap sync` drops the watch target from project.pbxproj.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PBX = ROOT / "ios/App/App.xcodeproj/project.pbxproj"
SCHEME = ROOT / "ios/App/App.xcodeproj/xcshareddata/xcschemes/TicTacDohWatch.xcscheme"
APP_SCHEME = ROOT / "ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme"

WATCH_TARGET = "A11C0D220000000000000001"
TEST_TARGET = "A11C0D220000000000000002"
WATCH_PRODUCT = "A11C0D220000000000000003"
TEST_PRODUCT = "A11C0D220000000000000004"
WATCH_SOURCES = "A11C0D220000000000000005"
WATCH_FRAMEWORKS = "A11C0D220000000000000006"
WATCH_RESOURCES = "A11C0D220000000000000007"
TEST_SOURCES = "A11C0D220000000000000008"
TEST_FRAMEWORKS = "A11C0D220000000000000009"
TEST_RESOURCES = "A11C0D22000000000000000A"
EMBED_PHASE = "A11C0D22000000000000000B"
EMBED_FILE = "A11C0D22000000000000000C"
APP_DEP = "A11C0D22000000000000000D"
APP_PROXY = "A11C0D22000000000000000E"
TEST_DEP = "A11C0D22000000000000000F"
TEST_PROXY = "A11C0D220000000000000010"
WATCH_GROUP = "A11C0D220000000000000011"
TEST_GROUP = "A11C0D220000000000000012"
PLIST_REF = "A11C0D220000000000000013"
ASSET_REF = "A11C0D220000000000000014"
ASSET_BUILD = "A11C0D220000000000000015"
JSON_REF = "A11C0D220000000000000016"
JSON_BUILD = "A11C0D220000000000000017"
WATCH_LIST = "A11C0D220000000000000018"
TEST_LIST = "A11C0D220000000000000019"
WATCH_DEBUG = "A11C0D22000000000000001A"
WATCH_RELEASE = "A11C0D22000000000000001B"
TEST_DEBUG = "A11C0D22000000000000001C"
TEST_RELEASE = "A11C0D22000000000000001D"

APP_TARGET = "504EC3031FED79650016851F"
PROJECT = "504EC2FC1FED79650016851F"
ROOT_GROUP = "504EC2FB1FED79650016851F"
PRODUCTS_GROUP = "504EC3051FED79650016851F"

WATCH_SWIFT = [
    "TicTacDohWatchApp.swift",
    "Game/Board.swift",
    "Game/Rules.swift",
    "Game/CPU.swift",
    "Game/Match.swift",
    "Game/Session.swift",
    "Views/TileView.swift",
    "Views/SetupView.swift",
    "Views/PlayView.swift",
    "Views/RoundOverView.swift",
    "Views/MatchOverView.swift",
    "Views/WatchHaptics.swift",
]
TEST_SWIFT = [
    "FixtureLoader.swift",
    "RulesTests.swift",
    "CPUTests.swift",
    "MatchTests.swift",
]


def sid(index: int) -> str:
    return f"A11C0D22000000000000{index:04X}"


def watch_settings(name: str) -> str:
    swift_debug = ""
    if name == "Debug":
        swift_debug = "\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;\n\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = \"-Onone\";\n"
    else:
        swift_debug = "\t\t\t\tSWIFT_COMPILATION_MODE = wholemodule;\n\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = \"-O\";\n"
    config_id = WATCH_DEBUG if name == "Debug" else WATCH_RELEASE
    return f"""\t\t{config_id} /* {name} */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tDEVELOPMENT_TEAM = J866FQ2YZ9;
\t\t\t\tENABLE_PREVIEWS = YES;
\t\t\t\tGENERATE_INFOPLIST_FILE = YES;
\t\t\t\tINFOPLIST_FILE = TicTacDohWatch/Info.plist;
\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = "Tic-Tac-Doh";
\t\t\t\tINFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;
\t\t\t\tINFOPLIST_KEY_WKCompanionAppBundleIdentifier = com.chrisstoy.tictacdoh;
\t\t\t\tINFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp = YES;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.chrisstoy.tictacdoh.watchkitapp;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSDKROOT = watchos;
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSUPPORTED_PLATFORMS = "watchos watchsimulator";
{swift_debug}\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = 4;
\t\t\t\tWATCHOS_DEPLOYMENT_TARGET = 10.0;
\t\t\t}};
\t\t\tname = {name};
\t\t}};
"""


def test_settings(name: str) -> str:
    config_id = TEST_DEBUG if name == "Debug" else TEST_RELEASE
    return f"""\t\t{config_id} /* {name} */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tBUNDLE_LOADER = "$(TEST_HOST)";
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tDEVELOPMENT_TEAM = J866FQ2YZ9;
\t\t\t\tGENERATE_INFOPLIST_FILE = YES;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t\t"@loader_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.chrisstoy.tictacdoh.watchkitapp.tests;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSDKROOT = watchos;
\t\t\t\tSUPPORTED_PLATFORMS = "watchos watchsimulator";
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = 4;
\t\t\t\tTEST_HOST = "$(BUILT_PRODUCTS_DIR)/TicTacDohWatch.app/TicTacDohWatch";
\t\t\t\tWATCHOS_DEPLOYMENT_TARGET = 10.0;
\t\t\t}};
\t\t\tname = {name};
\t\t}};
"""


def main() -> None:
    text = PBX.read_text()
    if "TicTacDohWatch" in text and WATCH_TARGET in text:
        print("watch target already present")
    else:
        text = insert(text)
        PBX.write_text(text)
        print("updated", PBX)

    SCHEME.parent.mkdir(parents=True, exist_ok=True)
    SCHEME.write_text(scheme_xml())
    app = APP_SCHEME.read_text()
    if WATCH_TARGET not in app:
        entry = f"""\t\t<BuildActionEntry
\t\t\tbuildForTesting = "YES"
\t\t\tbuildForRunning = "YES"
\t\t\tbuildForProfiling = "YES"
\t\t\tbuildForArchiving = "YES"
\t\t\tbuildForAnalyzing = "YES">
\t\t\t<BuildableReference
\t\t\t\tBuildableIdentifier = "primary"
\t\t\t\tBlueprintIdentifier = "{WATCH_TARGET}"
\t\t\t\tBuildableName = "TicTacDohWatch.app"
\t\t\t\tBlueprintName = "TicTacDohWatch"
\t\t\t\tReferencedContainer = "container:App.xcodeproj">
\t\t\t</BuildableReference>
\t\t</BuildActionEntry>
"""
        app = app.replace("</BuildActionEntries>", entry + "      </BuildActionEntries>", 1)
        APP_SCHEME.write_text(app)
        print("updated App scheme")
    else:
        print("App scheme already references the watch target")


def insert(text: str) -> str:
    build_files = []
    file_refs = []
    watch_source_lines = []
    test_source_lines = []
    watch_group_children = []
    test_group_children = []

    for index, relative in enumerate(WATCH_SWIFT):
        ref = sid(0x100 + index)
        build = sid(0x200 + index)
        name = Path(relative).name
        file_refs.append(
            f"\t\t{ref} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {relative}; sourceTree = \"<group>\"; }};"
        )
        build_files.append(
            f"\t\t{build} /* {name} in Sources */ = {{isa = PBXBuildFile; fileRef = {ref} /* {name} */; }};"
        )
        watch_source_lines.append(f"\t\t\t\t{build} /* {name} in Sources */,")
        watch_group_children.append(f"\t\t\t\t{ref} /* {name} */,")

    for index, relative in enumerate(TEST_SWIFT):
        ref = sid(0x300 + index)
        build = sid(0x400 + index)
        name = Path(relative).name
        file_refs.append(
            f"\t\t{ref} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {relative}; sourceTree = \"<group>\"; }};"
        )
        build_files.append(
            f"\t\t{build} /* {name} in Sources */ = {{isa = PBXBuildFile; fileRef = {ref} /* {name} */; }};"
        )
        test_source_lines.append(f"\t\t\t\t{build} /* {name} in Sources */,")
        test_group_children.append(f"\t\t\t\t{ref} /* {name} */,")

    file_refs.append(
        f"\t\t{PLIST_REF} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; }};"
    )
    file_refs.append(
        f"\t\t{ASSET_REF} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = \"<group>\"; }};"
    )
    file_refs.append(
        f"\t\t{JSON_REF} /* game-cases.json */ = {{isa = PBXFileReference; lastKnownFileType = text.json; name = game-cases.json; path = ../../../test-fixtures/game-cases.json; sourceTree = \"<group>\"; }};"
    )
    file_refs.append(
        f"\t\t{WATCH_PRODUCT} /* TicTacDohWatch.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = TicTacDohWatch.app; sourceTree = BUILT_PRODUCTS_DIR; }};"
    )
    file_refs.append(
        f"\t\t{TEST_PRODUCT} /* TicTacDohWatchTests.xctest */ = {{isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = TicTacDohWatchTests.xctest; sourceTree = BUILT_PRODUCTS_DIR; }};"
    )
    build_files.append(
        f"\t\t{ASSET_BUILD} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {ASSET_REF} /* Assets.xcassets */; }};"
    )
    build_files.append(
        f"\t\t{JSON_BUILD} /* game-cases.json in Resources */ = {{isa = PBXBuildFile; fileRef = {JSON_REF} /* game-cases.json */; }};"
    )
    build_files.append(
        f"\t\t{EMBED_FILE} /* TicTacDohWatch.app in Embed Watch Content */ = {{isa = PBXBuildFile; fileRef = {WATCH_PRODUCT} /* TicTacDohWatch.app */; settings = {{ATTRIBUTES = (RemoveHeadersOnCopy, ); }}; }};"
    )
    watch_group_children.append(f"\t\t\t\t{PLIST_REF} /* Info.plist */,")
    watch_group_children.append(f"\t\t\t\t{ASSET_REF} /* Assets.xcassets */,")
    test_group_children.append(f"\t\t\t\t{JSON_REF} /* game-cases.json */,")

    text = text.replace(
        "/* Begin PBXBuildFile section */\n",
        "/* Begin PBXBuildFile section */\n" + "\n".join(build_files) + "\n",
        1,
    )
    text = text.replace(
        "/* Begin PBXFileReference section */\n",
        "/* Begin PBXFileReference section */\n" + "\n".join(file_refs) + "\n",
        1,
    )

    frameworks = f"""\t\t{WATCH_FRAMEWORKS} /* Frameworks */ = {{
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
\t\t{TEST_FRAMEWORKS} /* Frameworks */ = {{
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
"""
    text = text.replace("/* End PBXFrameworksBuildPhase section */\n", frameworks + "/* End PBXFrameworksBuildPhase section */\n", 1)

    groups = f"""\t\t{WATCH_GROUP} /* TicTacDohWatch */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
{chr(10).join(watch_group_children)}
\t\t\t);
\t\t\tpath = TicTacDohWatch;
\t\t\tsourceTree = "<group>";
\t\t}};
\t\t{TEST_GROUP} /* TicTacDohWatchTests */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
{chr(10).join(test_group_children)}
\t\t\t);
\t\t\tpath = TicTacDohWatchTests;
\t\t\tsourceTree = "<group>";
\t\t}};
"""
    text = text.replace("/* End PBXGroup section */\n", groups + "/* End PBXGroup section */\n", 1)
    text = text.replace(
        "\t\t\t\t504EC3061FED79650016851F /* App */,",
        "\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t"
        + WATCH_GROUP
        + " /* TicTacDohWatch */,\n\t\t\t\t"
        + TEST_GROUP
        + " /* TicTacDohWatchTests */,",
        1,
    )
    text = text.replace(
        "\t\t\t\t504EC3041FED79650016851F /* App.app */,",
        "\t\t\t\t504EC3041FED79650016851F /* App.app */,\n\t\t\t\t"
        + WATCH_PRODUCT
        + " /* TicTacDohWatch.app */,\n\t\t\t\t"
        + TEST_PRODUCT
        + " /* TicTacDohWatchTests.xctest */,",
        1,
    )

    targets = f"""\t\t{WATCH_TARGET} /* TicTacDohWatch */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {WATCH_LIST} /* Build configuration list for PBXNativeTarget "TicTacDohWatch" */;
\t\t\tbuildPhases = (
\t\t\t\t{WATCH_SOURCES} /* Sources */,
\t\t\t\t{WATCH_FRAMEWORKS} /* Frameworks */,
\t\t\t\t{WATCH_RESOURCES} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = TicTacDohWatch;
\t\t\tproductName = TicTacDohWatch;
\t\t\tproductReference = {WATCH_PRODUCT} /* TicTacDohWatch.app */;
\t\t\tproductType = "com.apple.product-type.application";
\t\t}};
\t\t{TEST_TARGET} /* TicTacDohWatchTests */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {TEST_LIST} /* Build configuration list for PBXNativeTarget "TicTacDohWatchTests" */;
\t\t\tbuildPhases = (
\t\t\t\t{TEST_SOURCES} /* Sources */,
\t\t\t\t{TEST_FRAMEWORKS} /* Frameworks */,
\t\t\t\t{TEST_RESOURCES} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t\t{TEST_DEP} /* PBXTargetDependency */,
\t\t\t);
\t\t\tname = TicTacDohWatchTests;
\t\t\tproductName = TicTacDohWatchTests;
\t\t\tproductReference = {TEST_PRODUCT} /* TicTacDohWatchTests.xctest */;
\t\t\tproductType = "com.apple.product-type.bundle.unit-test";
\t\t}};
"""
    text = text.replace("/* End PBXNativeTarget section */\n", targets + "/* End PBXNativeTarget section */\n", 1)

    text = text.replace(
        """\t\t\t\t504EC3031FED79650016851F = {
\t\t\t\t\tCreatedOnToolsVersion = 9.2;
\t\t\t\t\tLastSwiftMigration = 1100;
\t\t\t\t\tProvisioningStyle = Automatic;
\t\t\t\t};""",
        """\t\t\t\t504EC3031FED79650016851F = {
\t\t\t\t\tCreatedOnToolsVersion = 9.2;
\t\t\t\t\tLastSwiftMigration = 1100;
\t\t\t\t\tProvisioningStyle = Automatic;
\t\t\t\t};
\t\t\t\t"""
        + WATCH_TARGET
        + """ = {
\t\t\t\t\tCreatedOnToolsVersion = 16.0;
\t\t\t\t\tProvisioningStyle = Automatic;
\t\t\t\t};
\t\t\t\t"""
        + TEST_TARGET
        + """ = {
\t\t\t\t\tCreatedOnToolsVersion = 16.0;
\t\t\t\t\tProvisioningStyle = Automatic;
\t\t\t\t\tTestTargetID = """
        + WATCH_TARGET
        + """;
\t\t\t\t};""",
        1,
    )
    text = text.replace(
        "\t\t\t\t504EC3031FED79650016851F /* App */,\n",
        "\t\t\t\t504EC3031FED79650016851F /* App */,\n\t\t\t\t"
        + WATCH_TARGET
        + " /* TicTacDohWatch */,\n\t\t\t\t"
        + TEST_TARGET
        + " /* TicTacDohWatchTests */,\n",
        1,
    )

    resources = f"""\t\t{WATCH_RESOURCES} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t{ASSET_BUILD} /* Assets.xcassets in Resources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
\t\t{TEST_RESOURCES} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t{JSON_BUILD} /* game-cases.json in Resources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
"""
    text = text.replace("/* End PBXResourcesBuildPhase section */\n", resources + "/* End PBXResourcesBuildPhase section */\n", 1)

    sources = f"""\t\t{WATCH_SOURCES} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
{chr(10).join(watch_source_lines)}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
\t\t{TEST_SOURCES} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
{chr(10).join(test_source_lines)}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
"""
    text = text.replace("/* End PBXSourcesBuildPhase section */\n", sources + "/* End PBXSourcesBuildPhase section */\n", 1)

    extra = f"""
/* Begin PBXContainerItemProxy section */
\t\t{APP_PROXY} /* PBXContainerItemProxy */ = {{
\t\t\tisa = PBXContainerItemProxy;
\t\t\tcontainerPortal = {PROJECT} /* Project object */;
\t\t\tproxyType = 1;
\t\t\tremoteGlobalIDString = {WATCH_TARGET};
\t\t\tremoteInfo = TicTacDohWatch;
\t\t}};
\t\t{TEST_PROXY} /* PBXContainerItemProxy */ = {{
\t\t\tisa = PBXContainerItemProxy;
\t\t\tcontainerPortal = {PROJECT} /* Project object */;
\t\t\tproxyType = 1;
\t\t\tremoteGlobalIDString = {WATCH_TARGET};
\t\t\tremoteInfo = TicTacDohWatch;
\t\t}};
/* End PBXContainerItemProxy section */

/* Begin PBXCopyFilesBuildPhase section */
\t\t{EMBED_PHASE} /* Embed Watch Content */ = {{
\t\t\tisa = PBXCopyFilesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tdstPath = "$(CONTENTS_FOLDER_PATH)/Watch";
\t\t\tdstSubfolderSpec = 16;
\t\t\tfiles = (
\t\t\t\t{EMBED_FILE} /* TicTacDohWatch.app in Embed Watch Content */,
\t\t\t);
\t\t\tname = "Embed Watch Content";
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXCopyFilesBuildPhase section */

/* Begin PBXTargetDependency section */
\t\t{APP_DEP} /* PBXTargetDependency */ = {{
\t\t\tisa = PBXTargetDependency;
\t\t\ttarget = {WATCH_TARGET} /* TicTacDohWatch */;
\t\t\ttargetProxy = {APP_PROXY} /* PBXContainerItemProxy */;
\t\t}};
\t\t{TEST_DEP} /* PBXTargetDependency */ = {{
\t\t\tisa = PBXTargetDependency;
\t\t\ttarget = {WATCH_TARGET} /* TicTacDohWatch */;
\t\t\ttargetProxy = {TEST_PROXY} /* PBXContainerItemProxy */;
\t\t}};
/* End PBXTargetDependency section */

"""
    text = text.replace("/* Begin XCBuildConfiguration section */\n", extra + "/* Begin XCBuildConfiguration section */\n", 1)
    text = text.replace(
        "/* End XCBuildConfiguration section */\n",
        watch_settings("Debug") + watch_settings("Release") + test_settings("Debug") + test_settings("Release") + "/* End XCBuildConfiguration section */\n",
        1,
    )
    lists = f"""\t\t{WATCH_LIST} /* Build configuration list for PBXNativeTarget "TicTacDohWatch" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{WATCH_DEBUG} /* Debug */,
\t\t\t\t{WATCH_RELEASE} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
\t\t{TEST_LIST} /* Build configuration list for PBXNativeTarget "TicTacDohWatchTests" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{TEST_DEBUG} /* Debug */,
\t\t\t\t{TEST_RELEASE} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
"""
    text = text.replace("/* End XCConfigurationList section */\n", lists + "/* End XCConfigurationList section */\n", 1)

    text = text.replace(
        """\t\t\tbuildPhases = (
\t\t\t\t504EC3001FED79650016851F /* Sources */,
\t\t\t\t504EC3011FED79650016851F /* Frameworks */,
\t\t\t\t504EC3021FED79650016851F /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = App;""",
        """\t\t\tbuildPhases = (
\t\t\t\t504EC3001FED79650016851F /* Sources */,
\t\t\t\t504EC3011FED79650016851F /* Frameworks */,
\t\t\t\t504EC3021FED79650016851F /* Resources */,
\t\t\t\t"""
        + EMBED_PHASE
        + """ /* Embed Watch Content */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t\t"""
        + APP_DEP
        + """ /* PBXTargetDependency */,
\t\t\t);
\t\t\tname = App;""",
        1,
    )
    return text


def scheme_xml() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{WATCH_TARGET}"
               BuildableName = "TicTacDohWatch.app"
               BlueprintName = "TicTacDohWatch"
               ReferencedContainer = "container:App.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
      <Testables>
         <TestableReference
            skipped = "NO">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{TEST_TARGET}"
               BuildableName = "TicTacDohWatchTests.xctest"
               BlueprintName = "TicTacDohWatchTests"
               ReferencedContainer = "container:App.xcodeproj">
            </BuildableReference>
         </TestableReference>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{WATCH_TARGET}"
            BuildableName = "TicTacDohWatch.app"
            BlueprintName = "TicTacDohWatch"
            ReferencedContainer = "container:App.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{WATCH_TARGET}"
            BuildableName = "TicTacDohWatch.app"
            BlueprintName = "TicTacDohWatch"
            ReferencedContainer = "container:App.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
"""


if __name__ == "__main__":
    main()
