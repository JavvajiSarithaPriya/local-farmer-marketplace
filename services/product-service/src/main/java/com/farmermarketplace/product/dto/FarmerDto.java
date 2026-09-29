package com.farmermarketplace.product.dto;

public class FarmerDto {
    private Long id;
    private String fullName;
    private String name;
    private String mobileNumber;
    private String phone;
    private String email;
    private String address;
    private String village;
    private String district;
    private String state;
    private String pincode;

    public FarmerDto() {}

    public FarmerDto(Long id, String fullName, String mobileNumber, String address, String village, String district, String state) {
        this.id = id;
        this.fullName = fullName;
        this.mobileNumber = mobileNumber;
        this.address = address;
        this.village = village;
        this.district = district;
        this.state = state;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
}
