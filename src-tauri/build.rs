fn main() {
  // Check if we're cross-compiling to Windows from macOS
  let target = std::env::var("TARGET").unwrap_or_default();
  let host = std::env::var("HOST").unwrap_or_default();
  
  if target.contains("windows") && host.contains("darwin") {
    // Skip resource compilation for cross-compilation from macOS
    println!("cargo:warning=Cross-compiling from macOS to Windows, skipping resource compilation");
    
    // Create a dummy resource.lib file to satisfy the linker
    let out_dir = std::env::var("OUT_DIR").unwrap();
    let resource_path = std::path::Path::new(&out_dir).join("resource.lib");
    
    // Create an empty archive file that the linker will accept
    std::fs::write(&resource_path, &[0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E, 0x0A]).unwrap();
    
    // Tell cargo to link the resource file
    println!("cargo:rustc-link-search=native={}", out_dir);
    println!("cargo:rustc-link-lib=static=resource");
  } else {
    // Normal build (including native Windows builds in GitHub Actions)
    tauri_build::build()
  }
}
